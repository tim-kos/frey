'use strict'
import Command from '../Command'
// import depurar from 'depurar'; const debug = depurar('frey')
import chalk from 'chalk'
import _ from 'lodash'

class Launch extends Command {
  constructor (name, runtime) {
    super(name, runtime)
    this.boot = [
      '_gatherTerraformArgs'
    ]
  }

  _gatherTerraformArgs (options, cb) {
    const terraformArgs = []
    if (!chalk.enabled) {
      terraformArgs.push('-no-color')
    }

    terraformArgs.push(`-parallelism=${this.runtime.compile.global.terraform.parallelism}`)
    terraformArgs.push(`-state=${this.runtime.init.paths.stateFile}`)

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

      this._out(`--> Saved state to '${this.runtime.init.paths.stateFile}'\n`)

      return cb(null)
    })
  }
}

module.exports = Launch
