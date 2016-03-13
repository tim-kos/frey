'use strict'
import Terraform from '../Terraform'
import Command from '../Command'
import _ from 'lodash'

// import depurar from 'depurar'; const debug = depurar('frey')

class Destroy extends Command {
  constructor (name, runtime) {
    super(name, runtime)
    this.boot = [
      '_confirm'
    ]
  }

  _confirm (cargo, cb) {
    if (!_.has(this.runtime.config, 'infra')) {
      this._out(`Skipping as there are no install instructions\n`)
      return cb(null)
    }
    this.shell.confirm('May I destroy your infrastructure?', cb)
  }

  main (cargo, cb) {
    if (!_.has(this.runtime.config, 'infra')) {
      this._out(`Skipping as there are no install instructions\n`)
      return cb(null)
    }

    const terraform = new Terraform({
      args: {
        destroy: undefined,
        force: true
      },
      runtime: this.runtime,
      cmdOpts: {
        verbose: true,
        limitSamples: false
      }
    })

    terraform.exe((err, stdout) => {
      if (err) {
        return cb(err)
      }

      this._out(`--> Saved new state to '${this.runtime.config.global.infra_state_file}'\n`)

      return cb(null)
    })
  }
}

module.exports = Destroy
