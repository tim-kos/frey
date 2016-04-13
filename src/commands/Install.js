'use strict'
import Ansible from '../Ansible'
import Command from '../Command'
import _ from 'lodash'
import depurar from 'depurar'; const debug = depurar('frey')
import constants from '../constants'

class Install extends Command {
  main (cargo, cb) {
    if (!_.has(this.runtime.config, 'install.playbooks')) {
      debug('Skipping as there are no install instructions')
      return cb(null)
    }

    const opts = { args: {}, runtime: this.runtime }

    opts.args[this.runtime.config.global.install_file] = constants.SHELLARG_APPEND_AS_IS

    const ansible = new Ansible(opts)
    ansible.exe(cb)
  }
}

module.exports = Install
