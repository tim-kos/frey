'use strict'
import Terraform from '../Terraform'
import Command from '../Command'
import _ from 'lodash'
import depurar from 'depurar'; const debug = depurar('frey')

class Refresh extends Command {
  main (cargo, cb) {
    if (!_.has(this.runtime.config, 'install')) {
      debug(`Skipping as there are no install instructions`)
      return cb(null)
    }

    const terraform = new Terraform({
      args: {
        refresh: true
      },
      runtime: this.runtime,
      cmdOpts: {
        verbose: false,
        limitSamples: false
      }
    })

    terraform.exe((err, stdout) => {
      if (err) {
        if (`${err.details}`.match(/when there is existing state/)) {
          debug('Ignoring refresh error about missing statefile')
          return cb(null)
        } else {
          return cb(err)
        }
      }

      debug('Saved state')
      return cb(null)
    })
  }
}

module.exports = Refresh
