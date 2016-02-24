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

class Compile extends Command {
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
    const pattern = `${this.runtime.init.cliargs.projectdir}/*.toml`
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

      tomlParsedItems.push(TOML.parse(`${buf}`))
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
      global: {
        terraform: {
          parallelism: '{{{init.os.cores}}}'
        },
        toolsdir: '{{{init.os.home}}}/.frey/tools',
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
    config.global.toolsdir = path.resolve(this.runtime.init.cliargs.projectdir, config.global.toolsdir)
    config.global.ssh.keysdir = path.resolve(config.global.ssh.keysdir)

    return cb(null, config)
  }

  _writeTerraformFile (cargo, cb) {
    const cfgBlock = _.get(this.bootCargo._renderConfig, 'infra')

    // Automatically add all FREY_* environment variables to Terraform config
    _.forOwn(this.runtime.init.env, (val, key) => {
      if (_.startsWith(key, 'FREY_')) {
        _.set(cfgBlock, 'variable.' + key + '.type', 'string')
      }
    })

    if (!cfgBlock) {
      debug('No infra instructions found in merged toml')
      fs.unlink(this.runtime.init.paths.infraFile, err => {
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

    debug('Writing %s', this.runtime.init.paths.infraFile)
    return fs.writeFile(this.runtime.init.paths.infraFile, encoded, cb)
  }

  _writeAnsibleCfg (cargo, cb) {
    const cfgBlock = _.get(this.bootCargo._renderConfig, 'install.config')

    if (!cfgBlock) {
      debug('No config instructions found in merged toml')
      fs.unlink(this.runtime.init.paths.ansibleCfg, err => {
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
      return cb(new Error('Unable to convert project to ansibleCfg INI'))
    }

    // Ansible strips over a quoted `ssh_args="-o x=y -o w=z"`, as it uses exec to call
    // ssh, and all treats multiple option arguments as one.
    // So we remove all double-quotes here. If that poses problems I don't foresee at
    // this point, the replace has to be limited in scope:
    encoded = encoded.replace(/\"/g, '')

    debug('Writing %s', this.runtime.init.paths.ansibleCfg)
    return fs.writeFile(this.runtime.init.paths.ansibleCfg, encoded, cb)
  }

  _writeAnsiblePlaybook (cargo, cb) {
    const cfgBlock = _.get(this.bootCargo._renderConfig, 'install.playbooks')

    if (!cfgBlock) {
      debug('No install playbooks found in merged toml')
      fs.unlink(this.runtime.init.paths.playbookFile, err => {
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

    debug('Writing %s', this.runtime.init.paths.playbookFile)
    return fs.writeFile(this.runtime.init.paths.playbookFile, encoded, cb)
  }

  main (cargo, cb) {
    return cb(null, this.bootCargo._renderConfig)
  }
}

module.exports = Compile
