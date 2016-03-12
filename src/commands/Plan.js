'use strict'
import Terraform from '../Terraform'
import Command from '../Command'
import _ from 'lodash'
import depurar from 'depurar'; const debug = depurar('frey')

class Plan extends Command {
  main (cargo, cb) {
    if (!_.has(this.runtime.config, 'install')) {
      debug(`Skipping as there are no install instructions`)
      return cb(null)
    }

    const terraform = new Terraform({
      args: {
        plan: true,
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
        return cb(null)
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
