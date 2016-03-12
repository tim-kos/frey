'use strict'
import Ansible from '../Ansible'
import fs from 'fs'
import depurar from 'depurar'; const debug = depurar('frey')

class Install extends Ansible {
  _gatherArgs (cargo, cb) {
    fs.stat(this.runtime.config.global.install_file, (err) => {
      if (err) {
        // Doesn't exist
        debug(`Skipping as there are no install instructions`)
        return cb(null, false)
      }

      super._gatherArgs(cargo, (err, args) => {
        if (err) {
          return cb(err)
        }
        args.push(`${this.runtime.config.global.install_file}`)
        return cb(null, args)
      })
    })
  }
}

module.exports = Install
