'use strict'
import Command from '../Command'
// import depurar from 'depurar'; const debug = depurar('frey')
import chalk from 'chalk'
import _ from 'lodash'

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
    terraformArgs.push(`-state=${this.runtime.compile.global.paths.stateFile}`)

    return cb(null, terraformArgs)
  }

  main (cargo, cb) {
    const appProps = _.find(this.runtime.prepare.deps, {name: 'terraform'})
    const terraformExe = appProps.exe
    let cmd = [
      terraformExe,
      'apply'
    ]
    cmd = cmd.concat(this.bootCargo._gatherTerraformArgs)

    return this._exe(cmd, {verbose: true, limitSamples: false}, (err, stdout) => {
      if (err) {
        return cb(err)
      }

      this._out(`--> Saved state to '${this.runtime.compile.global.paths.stateFile}'\n`)

      return cb(null)
    })
  }
}

module.exports = Launch
