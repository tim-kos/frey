'use strict'
import Command from '../Command'
// import depurar from 'depurar'; const debug = depurar('frey')
import chalk from 'chalk'

class Launch extends Command {
  constructor (name, options, runtime) {
    super(name, options, runtime)
    this.boot = [
      '_gatherTerraformArgs'
    ]
  }

  _gatherTerraformArgs (options, cb) {
    const terraformArgs = []
    if (!chalk.enabled) {
      terraformArgs.push('-no-color')
    }

    terraformArgs.push(`-parallelism=${this.options.terraformParallelism}`)
    terraformArgs.push(`-state=${this.runtime.paths.stateFile}`)

    return cb(null, terraformArgs)
  }

  main (cargo, cb) {
    const terraformExe = ((() => {
      const result = []
      const iterable = this.runtime.deps
      for (let i = 0, dep; i < iterable.length; i++) {
        dep = iterable[i]
        if (dep.name === 'terraform') {
          result.push(dep.exe)
        }
      }
      return result
    })())[0]
    let cmd = [
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
