'use strict'
import App from './App'
import constants from './constants'

class Ssh extends App {
  exe (cb) {
    const defaults = {
      args: {},
      env: {},
      signatureOpts: { equal: '', quote: '', dash: '-', escape: false },
      cmdOpts: {
        stdin: 'inherit',
        stdout: 'inherit',
        stderr: 'inherit'
      },
      exe: 'ssh'
    }

    defaults.args['i'] = this.runtime.config.global.ssh.privatekey_file
    defaults.args['l'] = this.runtime.config.global.ssh.user

    defaults.args['-oUserKnownHostsFile=/dev/null'] = constants.SHELLARG_PREPEND_AS_IS
    defaults.args['-oCheckHostIP=no'] = constants.SHELLARG_PREPEND_AS_IS
    defaults.args['-oStrictHostKeyChecking=no'] = constants.SHELLARG_PREPEND_AS_IS

    if (this.runtime.init.cliargs.verbose) {
      defaults.args['vvvv'] = constants.SHELLARG_BOOLEAN_FLAG
    }

    this._exe(defaults, cb)
  }
}

module.exports = Ssh
