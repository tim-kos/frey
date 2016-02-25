'use strict'
import Command from '../Command'
import utils from '../Utils'
import path from 'path'
import depurar from 'depurar'; const debug = depurar('frey')
import glob from 'glob'
import async from 'async'
import fs from 'fs'
import _ from 'lodash'
import INI from 'ini'
import YAML from 'js-yaml'
import TOML from 'toml'
import {unflatten} from 'flat'

class Config extends Command {
  constructor (name, runtime) {
    super(name, runtime)
    this.boot = [
      '_findTomlFiles',
      '_readTomlFiles',
      '_mergeToOneConfig',
      '_applyDefaults',
      '_renderConfig',
      '_writeTerraformFile',
      '_writeAnsibleCfg',
      '_writeAnsiblePlaybook'
    ]
  }

  _findTomlFiles (cargo, cb) {
    let tomlFiles = []
    const pattern = `${this.runtime.init.cliargs.project_dir}/*.toml`
    debug(`Reading from '${pattern}'`)
    return glob(pattern, (err, files) => {
      if (err) {
        return cb(err)
      }

      tomlFiles = files
      return cb(null, tomlFiles)
    })
  }

  _readTomlFiles (tomlFiles, cb) {
    const tomlParsedItems = []
    return async.map(tomlFiles, fs.readFile, (err, buf) => {
      if (err) {
        return cb(err)
      }

      let parsed = {}
      let error
      try {
        parsed = TOML.parse(`${buf}`)
      } catch (e) {
        error = e
      }

      if (!parsed || error) {
        let msg = `Could not parse Freyfile TOML starting with: \n\n'` + _.truncate(buf) + `'\n\n`
        msg += error
        msg += '\n\nHint: Did you not surround your strings with double-quotes?'
        return cb(new Error(msg))
      }

      tomlParsedItems.push(parsed)
      return cb(null, tomlParsedItems)
    })
  }

  _mergeToOneConfig (tomlParsedItems, cb) {
    let config = {}

    tomlParsedItems.forEach(function (parsedItem) {
      config = _.extend(config, parsedItem)
    })

    return cb(null, config)
  }

  _applyDefaults (cargo, cb) {
    // Defaults
    const defaults = {
      infra: {
        settings: {
          parallelism: '{{{init.os.cores}}}'
        }
      },
      global: {
        tools_dir: '{{{init.os.home}}}/.frey/tools',
        ansible_settings_file: '{{{init.cliargs.project_dir}}}/Frey-residu-ansible.cfg',
        infra_plan_file: '{{{init.cliargs.project_dir}}}/Frey-residu-terraform.plan',
        infra_file: '{{{init.cliargs.project_dir}}}/Frey-residu-infra.tf.json',
        install_file: '{{{init.cliargs.project_dir}}}/Frey-residu-install.yml',
        infra_state_file: '{{{init.cliargs.project_dir}}}/Frey-state-terraform.tfstate',
        ssh: {
          keysdir: '{{{init.os.home}}}/.ssh',
          email: `{{{init.os.user}}}@{{{init.cliargs.app}}}.freyproject.io`,
          keypair_name: `{{{init.cliargs.app}}}`,
          keyprv_file: `{{{self.keysdir}}}/frey-{{{init.cliargs.app}}}.pem`,
          keypub_file: `{{{self.keysdir}}}/frey-{{{init.cliargs.app}}}.pub`,
          user: 'ubuntu'
        }
      }
    }

    // Take --cfg-var cli options
    let flatCliConfig = {}
    let cliConfig = {}
    if (this.runtime.init.cliargs.cfgVar) {
      if (!_.isArray(this.runtime.init.cliargs.cfgVar)) {
        this.runtime.init.cliargs.cfgVar = [ this.runtime.init.cliargs.cfgVar ]
      }
      this.runtime.init.cliargs.cfgVar.forEach(item => {
        let parts = item.split('=')
        let key = parts.shift()
        let value = parts.join('=')
        flatCliConfig[key] = value
      })

      cliConfig = unflatten(flatCliConfig, {delimiter: '.'})
    }

    // @todo Add environment config?
    // let envConfig = {}
    // envConfig = unflatten(this.runtime.init.env, {delimiter: '_'})
    // envConfig[frey]
    // this.runtime.init.env

    // Left is more important
    let config = _.defaultsDeep({}, cliConfig, this.bootCargo._mergeToOneConfig, defaults)

    return cb(null, config)
  }

  _renderConfig (cargo, cb) {
    let config = this.bootCargo._applyDefaults
    config = utils.render(config, this.runtime, {failhard: false})
    config = utils.render(config, {config: config}, {failhard: true})

    // Resolve to absolute paths
    config.global.tools_dir = path.resolve(this.runtime.init.cliargs.project_dir, config.global.tools_dir)
    config.global.ansible_settings_file = path.resolve(this.runtime.init.cliargs.project_dir, config.global.ansible_settings_file)
    config.global.infra_plan_file = path.resolve(this.runtime.init.cliargs.project_dir, config.global.infra_plan_file)
    config.global.infra_file = path.resolve(this.runtime.init.cliargs.project_dir, config.global.infra_file)
    config.global.install_file = path.resolve(this.runtime.init.cliargs.project_dir, config.global.install_file)
    config.global.infra_state_file = path.resolve(this.runtime.init.cliargs.project_dir, config.global.infra_state_file)

    config.global.ssh.keysdir = path.resolve(this.runtime.init.cliargs.project_dir, config.global.ssh.keysdir)

    return cb(null, config)
  }

  _writeTerraformFile (cargo, cb) {
    const cfgBlock = _.cloneDeep(_.get(this.bootCargo._renderConfig, 'infra'), 'settings')
    delete cfgBlock.settings

    // Automatically add all FREY_* environment variables to Terraform config
    _.forOwn(this.runtime.init.env, (val, key) => {
      if (_.startsWith(key, 'FREY_')) {
        _.set(cfgBlock, 'variable.' + key + '.type', 'string')
      }
    })

    if (!cfgBlock) {
      debug('No infra instructions found in merged toml')
      fs.unlink(this.bootCargo._renderConfig.global.infra_file, err => {
        if (err) {
           // That's not fatal
        }
        return cb(null)
      })
      return
    }

    const encoded = JSON.stringify(cfgBlock, null, '  ')
    if (!encoded) {
      debug({cfgBlock: cfgBlock})
      return cb(new Error('Unable to convert project to Terraform infra JSON'))
    }

    debug('Writing %s', this.bootCargo._renderConfig.global.infra_file)
    return fs.writeFile(this.bootCargo._renderConfig.global.infra_file, encoded, cb)
  }

  _writeAnsibleCfg (cargo, cb) {
    const cfgBlock = _.get(this.bootCargo._renderConfig, 'install.settings')

    if (!cfgBlock) {
      debug('No config instructions found in merged toml')
      fs.unlink(this.bootCargo._renderConfig.global.ansible_settings_file, err => {
        if (err) {
          // That's not fatal
        }
        return cb(null)
      })
      return
    }

    let encoded = INI.encode(cfgBlock)
    if (!encoded) {
      debug({cfgBlock: cfgBlock})
      return cb(new Error('Unable to convert project to ansibleSettingsFile INI'))
    }

    // Ansible strips over a quoted `ssh_args="-o x=y -o w=z"`, as it uses exec to call
    // ssh, and all treats multiple option arguments as one.
    // So we remove all double-quotes here. If that poses problems I don't foresee at
    // this point, the replace has to be limited in scope:
    encoded = encoded.replace(/\"/g, '')

    debug('Writing %s', this.bootCargo._renderConfig.global.ansible_settings_file)
    return fs.writeFile(this.bootCargo._renderConfig.global.ansible_settings_file, encoded, cb)
  }

  _writeAnsiblePlaybook (cargo, cb) {
    const cfgBlock = _.get(this.bootCargo._renderConfig, 'install.playbooks')

    if (!cfgBlock) {
      debug('No install playbooks found in merged toml')
      fs.unlink(this.bootCargo._renderConfig.global.install_file, err => {
        if (err) {
           // That's not fatal
        }
        return cb(null)
      })
      return
    }

    const encoded = YAML.safeDump(cfgBlock)
    if (!encoded) {
      debug({cfgBlock: cfgBlock})
      return cb(new Error('Unable to convert project to Ansible playbook YAML'))
    }

    debug('Writing %s', this.bootCargo._renderConfig.global.install_file)
    return fs.writeFile(this.bootCargo._renderConfig.global.install_file, encoded, cb)
  }

  main (cargo, cb) {
    return cb(null, this.bootCargo._renderConfig)
  }
}

module.exports = Config
