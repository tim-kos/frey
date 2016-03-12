'use strict'
import Ansible from '../Ansible'

class Install extends Ansible {
  _gatherArgs (cargo, cb) {
    super._gatherArgs(cargo, (err, args) => {
      if (err) {
        return cb(err)
      }
      args.push(`${this.runtime.config.global.install_file}`)
      return cb(null, args)
    })
  }
}

module.exports = Install
