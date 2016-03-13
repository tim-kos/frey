'use strict'
import Terraform from '../Terraform'
import Command from '../Command'
import _ from 'lodash'

class Plan extends Command {
  main (cargo, cb) {
    if (!_.has(this.runtime.config, 'infra')) {
      this._out(`Skipping as there are no install instructions\n`)
      return cb(null)
    }

    const terraform = new Terraform({
      args: {
        plan: undefined,
        refresh: 'false',
        out: this.runtime.config.global.infra_plan_file
      },
      runtime: this.runtime
    })

    terraform.exe((err, stdout) => {
      if (err) {
        return cb(err)
      }

      this._out(`--> Saved plan as '${this.runtime.config.global.infra_plan_file}'\n`)

      if (stdout.match(/No changes/)) {
        return cb(null, {
          add: 0,
          change: 0,
          destroy: 0
        })
      }

      const match = stdout.match(/(\d+) to add, (\d+) to change, (\d+) to destroy/)
      if (!match) {
        return cb(new Error('Unable to parse add/change/destroy'))
      }

      return cb(null, {
        add: match[1],
        change: match[2],
        destroy: match[3]
      })
    })
  }
}

module.exports = Plan
