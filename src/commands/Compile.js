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
      '_writeSnippets'
    ]
  }

  _findTomlFiles (cargo, cb) {
    let tomlFiles = []
    const pattern = `${this.runtime.init.cliargs.recipeDir}/*.toml`
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
    const tomlContents = []
    return async.map(tomlFiles, fs.readFile, (err, buf) => {
      if (err) {
        return cb(err)
      }

      tomlContents.push(TOML.parse(`${buf}`))
      return cb(null, tomlContents)
    })
  }

  _mergeToOneConfig (tomlContents, cb) {
    let config = {}

    tomlContents.forEach(function (tom) {
      config = _.extend(config, tom)
    })

    return cb(null, config)
  }

  _writeSnippets (config = {}, cb) {
    const filesWritten = []

    return async.series([
      (callback) => {
        const val = _.get(config, 'infra')

        if (!val) {
          debug('No infra instructions found in merged toml')
          fs.unlink(this.runtime.init.paths.infraFile, err => {
            if (err) {
               // That's not fatal
            }
            return callback(null)
          })
          return
        }

        const encoded = JSON.stringify(val, null, '  ')
        if (!encoded) {
          debug({val: val})
          return callback(new Error('Unable to convert recipe to Terraform infra JSON'))
        }

        filesWritten.push(this.runtime.init.paths.infraFile)
        debug('Writing %s', this.runtime.init.paths.infraFile)
        return fs.writeFile(this.runtime.init.paths.infraFile, encoded, callback)
      },
      (callback) => {
        const val = _.get(config, 'install.config')

        if (!val) {
          debug('No config instructions found in merged toml')
          fs.unlink(this.runtime.init.paths.ansibleCfg, err => {
            if (err) {
              // That's not fatal
            }
            return callback(null)
          })
          return
        }

        let encoded = INI.encode(val)
        if (!encoded) {
          debug({val: val})
          return callback(new Error('Unable to convert recipe to ansibleCfg INI'))
        }

        // Ansible strips over a quoted `ssh_args="-o x=y -o w=z"`, as it uses exec to call
        // ssh, and all treats multiple option arguments as one.
        // So we remove all double-quotes here. If that poses problems I don't foresee at
        // this point, the replace has to be limited in scope:
        encoded = encoded.replace(/\"/g, '')

        filesWritten.push(this.runtime.init.paths.ansibleCfg)
        debug('Writing %s', this.runtime.init.paths.ansibleCfg)
        return fs.writeFile(this.runtime.init.paths.ansibleCfg, encoded, callback)
      },
      (callback) => {
        const val = _.get(config, 'install.playbooks')

        if (!val) {
          debug('No install playbooks found in merged toml')
          fs.unlink(this.runtime.init.paths.playbookFile, err => {
            if (err) {
               // That's not fatal
            }
            return callback(null)
          })
          return
        }

        const encoded = YAML.safeDump(val)
        if (!encoded) {
          debug({val: val})
          return callback(new Error('Unable to convert recipe to Ansible playbook YAML'))
        }

        filesWritten.push(this.runtime.init.paths.playbookFile)
        debug('Writing %s', this.runtime.init.paths.playbookFile)
        return fs.writeFile(this.runtime.init.paths.playbookFile, encoded, callback)
      }
    ], err => {
      if (err) {
        return cb(err)
      }

      return cb(null, config)
    })
  }

  main (projectConfig, cb) {
    // Defaults
    const defaults = {
      global: {
        toolsdir: '{{{init.os.home}}}/.frey/tools',
        recipedir: '{{{init.os.cwd}}}',
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

    // Take --config cli options
    let flatCliConfig = {}
    let cliConfig = {}
    if (this.runtime.init.cliargs.config) {
      if (!_.isArray(this.runtime.init.cliargs.config)) {
        this.runtime.init.cliargs.config = [ this.runtime.init.cliargs.config ]
      }
      this.runtime.init.cliargs.config.forEach(item => {
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
    let config = _.defaultsDeep({}, cliConfig, projectConfig, defaults)

    config = utils.render(config, this.runtime)

    // Resolve to absolute paths
    config.global.toolsdir = path.resolve(config.global.recipedir, config.global.toolsdir)
    config.global.ssh.keysdir = path.resolve(config.global.ssh.keysdir)

    debug({
      config: config,
      cliConfig: cliConfig,
      flatCliConfig: flatCliConfig
    })

    return cb(null, config)
  }
}

module.exports = Compile
