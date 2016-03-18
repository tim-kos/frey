'use strict'
import App from './App'

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

    defaults.args['-oUserKnownHostsFile=/dev/null'] = undefined
    defaults.args['-oCheckHostIP=no'] = undefined
    defaults.args['-oStrictHostKeyChecking=no'] = undefined

    if (this.runtime.init.cliargs.verbose) {
      defaults.args['vvvv'] = true
    }

    this._exe(defaults, cb)
  }
}

module.exports = Ssh
