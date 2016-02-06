'use strict'
import Command from '../Command'
import chalk from 'chalk'
// import depurar from 'depurar'; const debug = depurar('frey')
// import fs from 'fs'
// import _ from 'lodash'
// import async from 'async'

class Plan extends Command {
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

    terraformArgs.push('-refresh=false')
    terraformArgs.push(`-out=${this.runtime.paths.planFile}`)
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
      'plan'
    ]
    cmd = cmd.concat(this.bootCargo._gatherTerraformArgs)

    return this._exe(cmd, {}, (err, stdout) => {
      if (err) {
        return cb(err)
      }

      this._out(`--> Saved plan as '${this.runtime.paths.planFile}'\n`)

      if (stdout.match(/No changes/)) {
        return cb(null)
      }

      const m = stdout.match(/(\d+) to add, (\d+) to change, (\d+) to destroy/)
      if (!m) {
        return cb(new Error('Unable to parse add/change/destroy'))
      }

      this.runtime.launchPlan = {
        add: m[1],
        change: m[2],
        destroy: m[3]
      }

      return cb(null)
    })
  }
}

module.exports = Plan
