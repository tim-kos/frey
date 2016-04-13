'use strict'
import Ansible from '../Ansible'
import Command from '../Command'
import _ from 'lodash'
import constants from '../constants'
import depurar from 'depurar'; const debug = depurar('frey')

class Deploy extends Command {
  main (cargo, cb) {
    if (!_.has(this.runtime.config, 'deploy.playbooks')) {
      debug('Skipping as there are no deploy instructions')
      return cb(null)
    }

    const opts = { args: {}, runtime: this.runtime }

    opts.args[this.runtime.config.global.deploy_file] = constants.SHELLARG_APPEND_AS_IS

    const ansible = new Ansible(opts)
    ansible.exe(cb)
  }
}

module.exports = Deploy
