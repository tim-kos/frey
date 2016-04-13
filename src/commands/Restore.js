'use strict'
import Ansible from '../Ansible'
import Command from '../Command'
import constants from '../constants'
import _ from 'lodash'
import depurar from 'depurar'; const debug = depurar('frey')

class Restore extends Command {
  main (cargo, cb) {
    if (!_.has(this.runtime.config, 'restore.playbooks')) {
      debug('Skipping as there are no restore instructions')
      return cb(null)
    }

    const opts = { args: {}, runtime: this.runtime }

    opts.args[this.runtime.config.global.restore_file] = constants.SHELLARG_APPEND_AS_IS

    const ansible = new Ansible(opts)
    ansible.exe(cb)
  }
}

module.exports = Restore
