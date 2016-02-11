'use strict'
import Command from '../Command'
import depurar from 'depurar'; const debug = depurar('frey')
import chalk from 'chalk'
import _ from 'lodash'

class Refresh extends Command {
  constructor (name, options, runtime) {
    super(name, options, runtime)
    this.boot = [
      '_gatherTerraformArgs'
    ]
  }

  _gatherTerraformArgs (cargo, cb) {
    const terraformArgs = []
    if (!chalk.enabled) {
      terraformArgs.push('-no-color')
    }

    debug('Loaded config:')
    debug(this.runtime.compile)

    terraformArgs.push(`-state=${this.runtime.paths.stateFile}`)

    return cb(null, terraformArgs)
  }

  main (cargo, cb) {
    const appProps = _.find(this.runtime.deps, {name: 'terraform'})
    const terraformExe = appProps.exe
    let cmd = [
      terraformExe,
      'refresh'
    ]
    cmd = cmd.concat(this.bootCargo._gatherTerraformArgs)

    return this._exe(cmd, {verbose: false, limitSamples: false}, (err, stdout) => {
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
