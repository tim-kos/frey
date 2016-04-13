'use strict'
import Terraform from '../Terraform'
import Command from '../Command'
import _ from 'lodash'
import constants from '../constants'

class Infra extends Command {
  constructor (name, runtime) {
    super(name, runtime)
    this.boot = [
      '_confirm'
    ]
  }

  _confirm (cargo, cb) {
    if (!_.has(this.runtime.config, 'infra')) {
      this.info(`Skipping as there are no install instructions\n`)
      return cb(null)
    }

    if (!_.has(this.runtime, 'plan.change')) {
      return cb(new Error('Unable to find infra plan. This is step is required to launch infra. '))
    }

    if (this.runtime.plan.change > 0 || this.runtime.plan.destroy > 0) {
      return this.shell.confirm('This infra change is destructive in nature, may I proceed?', cb)
    } else {
      return cb(null)
    }
  }

  main (cargo, cb) {
    if (!_.has(this.runtime.config, 'infra')) {
      this.info(`Skipping as there are no install instructions\n`)
      return cb(null)
    }

    const terraform = new Terraform({
      args: {
        apply: constants.SHELLARG_PREPEND_AS_IS
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
