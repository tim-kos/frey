'use strict'
import Command from '../Command'
import depurar from 'depurar'; const debug = depurar('frey')
import glob from 'glob'
import async from 'async'
import fs from 'fs'
import _ from 'lodash'
import INI from 'ini'
const YAML = require('js-yaml')
import TOML from 'toml'

class Compile extends Command {
  constructor (name, options, runtime) {
    super(name, options, runtime)
    this.boot = [
      '_findTomlFiles',
      '_readTomlFiles',
      '_mergeToOneConfig',
      '_writeSnippets'
    ]
  }

  _findTomlFiles (cargo, cb) {
    let tomlFiles = []
    const pattern = `${this.options.recipeDir}/*.toml`
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

    debug(tomlContents)

    tomlContents.forEach(function (tom) {
      config = _.extend(config, tom)
    })

    return cb(null, config)
  }

  _writeSnippets (config = {}, cb) {
    const filesWritten = []

    return async.series([
      (callback) => {
        if (!config.infra) {
          debug('No infra instructions found in merged toml')
          fs.unlink(this.runtime.paths.infraFile, err => {
            if (err) {
               // That's not fatal
            }
            return callback(null)
          })
          return
        }

        const encoded = JSON.stringify(config.infra, null, '  ')
        if (!encoded) {
          return callback(new Error('Unable to convert recipe to Terraform infra JSON'))
        }

        filesWritten.push(this.runtime.paths.infraFile)
        return fs.writeFile(this.runtime.paths.infraFile, encoded, callback)
      },
      (callback) => {
        if (!config.install || !config.install.config) {
          debug('No config instructions found in merged toml')
          fs.unlink(this.runtime.paths.ansibleCfg, err => {
            if (err) {
              // That's not fatal
            }
            return callback(null)
          })
          return
        }

        let encoded = INI.encode(config.install.config)
        if (!encoded) {
          return callback(new Error('Unable to convert recipe to ansibleCfg INI'))
        }

        // Ansible strips over a quoted `ssh_args="-o x=y -o w=z"`, as it uses exec to call
        // ssh, and all treats multiple option arguments as one.
        // So we remove all double-quotes here. If that poses problems I don't foresee at
        // this point, the replace has to be limited in scope:
        encoded = encoded.replace(/\"/g, '')

        filesWritten.push(this.runtime.paths.ansibleCfg)
        return fs.writeFile(this.runtime.paths.ansibleCfg, encoded, callback)
      },
      (callback) => {
        if (!config.install || !config.install.playbooks) {
          debug('No install playbooks found in merged toml')
          fs.unlink(this.runtime.paths.playbookFile, err => {
            if (err) {
               // That's not fatal
            }
            return callback(null)
          })
          return
        }

        const encoded = YAML.safeDump(config.install.playbooks)
        if (!encoded) {
          return callback(new Error('Unable to convert recipe to Ansible playbook YAML'))
        }

        filesWritten.push(this.runtime.paths.playbookFile)
        return fs.writeFile(this.runtime.paths.playbookFile, encoded, callback)
      }
    ], err => {
      if (err) {
        return cb(err)
      }

      return cb(null, config)
    })
  }

  main (config, cb) {
    return cb(null, config)
  }
}

module.exports = Compile
