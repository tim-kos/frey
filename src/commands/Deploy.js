'use strict'
import Ansible from '../Ansible'
import fs from 'fs'
import depurar from 'depurar'; const debug = depurar('frey')

class Deploy extends Ansible {
  _gatherArgs (cargo, cb) {
    fs.stat(this.runtime.config.global.deploy_file, (err) => {
      if (err) {
        // Doesn't exist
        debug(`Skipping as there are no deploy instructions`)
        return cb(null, false)
      }

      super._gatherArgs(cargo, (err, args) => {
        if (err) {
          return cb(err)
        }
        args.push(`${this.runtime.config.global.deploy_file}`)
        return cb(null, args)
      })
    })
  }
}

module.exports = Deploy
