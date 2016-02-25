'use strict'
import Command from '../Command'
import depurar from 'depurar'; const debug = depurar('frey')
import chalk from 'chalk'
import _ from 'lodash'

class Destroy extends Command {
  constructor (name, runtime) {
    super(name, runtime)
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
    debug(this.runtime.config)

    terraformArgs.push(`-state=${this.runtime.config.global.infra_state_file}`)
    terraformArgs.push(`-force`)

    return cb(null, terraformArgs)
  }

  main (cargo, cb) {
    const appProps = _.find(this.runtime.prepare.deps, {name: 'terraform'})
    const terraformExe = appProps.exe
    let cmd = [
      terraformExe,
      'destroy'
    ]
    cmd = cmd.concat(this.bootCargo._gatherTerraformArgs)
    cmd = cmd.join(' ')

    return this._cmdYesNo(cmd, (err) => {
      if (err) {
        return cb(err)
      }

      return cb(null)
    })
  }
}

module.exports = Destroy
