'use strict'
var Command = require('../Command')
var debug = require('depurar')('frey')
var chalk = require('chalk')
var glob = require('glob')
var async = require('async')
var fs = require('fs')
var _ = require('lodash')
var INI = require('ini')
var YAML = require('js-yaml')
var TOML = require('toml')

class Refresh extends Command {
  constructor (name, options, runtime) {
    super(name, options, runtime)
    this.boot = [
      '_findTomlFiles',
      '_readTomlFiles',
      '_mergeToml',
      '_splitToml',
      '_gatherTerraformArgs'
    ]
  }

  _findTomlFiles (cargo, cb) {
    var tomlFiles = []
    var pattern = `${this.options.recipeDir}/*.toml`
    debug(`Reading from '${pattern}'`)
    return glob(pattern, function (err, files) {
      if (err) {
        return cb(err)
      }

      tomlFiles = files
      return cb(null, tomlFiles)
    })
  }

  _readTomlFiles (tomlFiles, cb) {
    var tomlContents = []
    return async.map(tomlFiles, fs.readFile, function (err, buf) {
      if (err) {
        return cb(err)
      }

      tomlContents.push(TOML.parse(`${buf}`))
      return cb(null, tomlContents)
    })
  }

  _mergeToml (tomlContents, cb) {
    var tomlMerged = {}
    for (var i = 0, tom; i < tomlContents.length; i++) {
      tom = tomlContents[i]
      tomlMerged = _.extend(tomlMerged, tom)
    }

    return cb(null, tomlMerged)
  }

  _splitToml (tomlMerged, cb) {
    var filesWritten = []

    return async.series([
      (callback) => {
        if (!(tomlMerged.infra != null)) {
          debug('No infra instructions found in merged toml')
          fs.unlink(this.runtime.paths.infraFile, function (err) {
            if (err) {
               // That's not fatal
            }
            return callback(null)
          })
          return
        }

        var encoded = JSON.stringify(tomlMerged.infra, null, '  ')
        if (!encoded) {
          return callback(new Error('Unable to convert recipe to Terraform infra JSON'))
        }

        filesWritten.push(this.runtime.paths.infraFile)
        return fs.writeFile(this.runtime.paths.infraFile, encoded, callback)
      },
      (callback) => {
        var ref
        if (!((((ref = tomlMerged.install) != null) ? ref.config : undefined) != null)) {
          debug('No config instructions found in merged toml')
          fs.unlink(this.runtime.paths.ansibleCfg, function (err) {
            if (err) {
              // That's not fatal
            }
            return callback(null)
          })
          return
        }

        var encoded = INI.encode(tomlMerged.install.config)
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
        var ref
        if (!((((ref = tomlMerged.install) != null) ? ref.playbooks : undefined) != null)) {
          debug('No install playbook instructions found in merged toml')
          fs.unlink(this.runtime.paths.playbookFile, function (err) {
            if (err) {
               // That's not fatal
            }
            return callback(null)
          })
          return
        }

        var encoded = YAML.safeDump(tomlMerged.install.playbooks)
        if (!encoded) {
          return callback(new Error('Unable to convert recipe to Ansible playbook YAML'))
        }

        filesWritten.push(this.runtime.paths.playbookFile)
        return fs.writeFile(this.runtime.paths.playbookFile, encoded, callback)
      }
    ], function (err) {
      if (err) {
        return cb(err)
      }

      return cb(null, filesWritten)
    }
    )
  }

  _gatherTerraformArgs (filesWritten, cb) {
    var terraformArgs = []
    if (!chalk.enabled) {
      terraformArgs.push('-no-color')
    }

    terraformArgs.push(`-state=${this.runtime.paths.stateFile}`)

    return cb(null, terraformArgs)
  }

  main (cargo, cb) {
    var terraformExe = ((() => {
      var result = []
      var iterable = this.runtime.deps
      for (var i = 0, dep; i < iterable.length; i++) {
        dep = iterable[i]
        if (dep.name === 'terraform') {
          result.push(dep.exe)
        }
      }
      return result
    })())[0]
    var cmd = [
      terraformExe,
      'refresh'
    ]
    cmd = cmd.concat(this.bootCargo._gatherTerraformArgs)

    return this._exe(cmd, {verbose: false, limitSamples: false}, function (err, stdout) {
      if (err) {
        if (`${err.details}`.match(/when there is existing state/)) {
          debug('Ignoring refresh error about missing statefile')
          return cb(null)
        } else {
          return cb(err)
        }
      }

      return cb(null)
    })
  }
}

module.exports = Refresh
