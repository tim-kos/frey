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

  _writeTerraformFile (cargo, cb) {
    const val = _.get(this.bootCargo._mergeToOneConfig, 'infra')

    if (!val) {
      debug('No infra instructions found in merged toml')
      fs.unlink(this.runtime.init.paths.infraFile, err => {
        if (err) {
           // That's not fatal
        }
        return cb(null)
      })
      return
    }

    const encoded = JSON.stringify(val, null, '  ')
    if (!encoded) {
      debug({val: val})
      return cb(new Error('Unable to convert project to Terraform infra JSON'))
    }

    debug('Writing %s', this.runtime.init.paths.infraFile)
    return fs.writeFile(this.runtime.init.paths.infraFile, encoded, cb)
  }

  _writeAnsibleCfg (cargo, cb) {
    const val = _.get(this.bootCargo._mergeToOneConfig, 'install.config')

    if (!val) {
      debug('No config instructions found in merged toml')
      fs.unlink(this.runtime.init.paths.ansibleCfg, err => {
        if (err) {
          // That's not fatal
        }
        return cb(null)
      })
      return
    }

    let encoded = INI.encode(val)
    if (!encoded) {
      debug({val: val})
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
    const val = _.get(this.bootCargo._mergeToOneConfig, 'install.playbooks')

    if (!val) {
      debug('No install playbooks found in merged toml')
      fs.unlink(this.runtime.init.paths.playbookFile, err => {
        if (err) {
           // That's not fatal
        }
        return cb(null)
      })
      return
    }

    const encoded = YAML.safeDump(val)
    if (!encoded) {
      debug({val: val})
      return cb(new Error('Unable to convert project to Ansible playbook YAML'))
    }

    debug('Writing %s', this.runtime.init.paths.playbookFile)
    return fs.writeFile(this.runtime.init.paths.playbookFile, encoded, cb)
  }

  main (cargo, cb) {
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

    config = utils.render(config, this.runtime)

    debug({
      cliConfig: cliConfig,
      defaults: defaults,
      projectConfig: this.bootCargo._mergeToOneConfig,
      config: config
    })

    // Resolve to absolute paths
    config.global.toolsdir = path.resolve(this.runtime.init.cliargs.projectdir, config.global.toolsdir)
    config.global.ssh.keysdir = path.resolve(config.global.ssh.keysdir)

    return cb(null, config)
  }
}

module.exports = Compile
