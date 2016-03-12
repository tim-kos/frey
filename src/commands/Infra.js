'use strict'
import Terraform from '../Terraform'
import Command from '../Command'
import _ from 'lodash'

class Infra extends Command {
  main (cargo, cb) {
    if (!_.has(this.runtime.config, 'infra')) {
      this.info(`Skipping as there are no install instructions\n`)
      return cb(null)
    }

    const terraform = new Terraform({
      args: {
        apply: true
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

module.exports = Infra
