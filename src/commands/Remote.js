'use strict'
import Terraform from '../Terraform'
import Ssh from '../Ssh'
import Command from '../Command'
import depurar from 'depurar'; const debug = depurar('frey')

class Remote extends Command {
  constructor (name, runtime) {
    super(name, runtime)
    this.boot = [
      '_gatherHost'
    ]
  }

  _gatherHost (cargo, cb) {
    const terraform = new Terraform({
      args: {
        output: undefined,
        state: this.runtime.config.global.infra_state_file,
        parallelism: null,
        public_address: undefined
      },
      runtime: this.runtime
    })

    terraform.exe((err, stdout) => {
      if (err) {
        return cb(err)
      }

      const host = `${stdout}`.split('\n')[0].trim()
      return cb(null, host)
    })
  }

  main (cargo, cb) {
    const opts = { args: {}, runtime: this.runtime }

    opts.args[this.bootCargo._gatherHost] = undefined
    // @todo command here for non-interactive/shell mode:
    // args.push "<cmd>"

    const ssh = new Ssh(opts)

    ssh.exe((err, stdout) => {
      if (err) {
        return cb(err)
      }

      this._out(`--> Closed console to '${this.bootCargo._gatherHost}'\n`)
      return cb(null)
    })
  }
}

module.exports = Remote
