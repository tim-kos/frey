'use strict'
var Command = require('../Command')
// var debug = require('depurar')('frey')
var chalk = require('chalk')

class Launch extends Command {
  constructor (name, options, runtime) {
    super(name, options, runtime)
    this.boot = [
      '_gatherTerraformArgs'
    ]
  }

  _gatherTerraformArgs (options, cb) {
    var terraformArgs = []
    if (!chalk.enabled) {
      terraformArgs.push('-no-color')
    }

    terraformArgs.push(`-parallelism=${this.options.terraformParallelism}`)
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
      'apply'
    ]
    cmd = cmd.concat(this.bootCargo._gatherTerraformArgs)

    return this._exe(cmd, {verbose: true, limitSamples: false}, (err, stdout) => {
      if (err) {
        return cb(err)
      }

      this._out(`--> Saved state to '${this.runtime.paths.stateFile}'\n`)

      return cb(null)
    })
  }
}

module.exports = Launch
