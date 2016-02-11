'use strict'
import Command from '../Command'
import chalk from 'chalk'
import _ from 'lodash'
// import depurar from 'depurar'; const debug = depurar('frey')
// import fs from 'fs'
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
    const appProps = _.find(this.runtime.deps, {name: 'terraform'})
    const terraformExe = appProps.exe

    let cmd = [
      terraformExe,
      'plan'
    ]
    cmd = cmd.concat(this.bootCargo._gatherTerraformArgs)

    this._exe(cmd, {}, (err, stdout) => {
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
