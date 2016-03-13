'use strict'
import Terraform from '../Terraform'
import Ssh from '../Ssh'
import Command from '../Command'
import inquirer from 'inquirer'
import _ from 'lodash'
import depurar from 'depurar'; const debug = depurar('frey')

class Remote extends Command {
  constructor (name, runtime) {
    super(name, runtime)
    this.boot = [
      '_gatherHosts',
      '_selectHosts'
    ]
  }

  _gatherHosts (cargo, cb) {
    const terraform = new Terraform({
      args: {
        output: undefined,
        state: this.runtime.config.global.infra_state_file,
        parallelism: null,
        public_addresses: undefined
      },
      runtime: this.runtime
    })

    terraform.exe((err, stdout) => {
      if (err) {
        return cb(err)
      }

      const trimmed = `${stdout}`.trim()
      if (!trimmed) {
        const msg = `Unable to get 'infra.output.public_addresses', this is a requirement to determine connection endpoints`
        return cb(new Error(msg))
      }

      const hosts = trimmed.split('\n')
      return cb(null, hosts)
    })
  }

  _selectHosts (cargo, cb) {
    // https://www.npmjs.com/package/inquirer
    const choices = []
    this.bootCargo._gatherHosts.forEach((hostname, i) => {
      choices.push({
        checked: (i === 0),
        name: hostname,
        value: hostname
      })
    })
    choices.push(new inquirer.Separator())
    choices.push({
      checked: false,
      name: 'All of the above',
      value: 'all'
    })

    const question = {
      type: 'checkbox',
      name: 'server',
      message: 'Select server',
      choices: choices
    }
    inquirer.prompt(question, (answers) => {
      if (!_.has(answers, 'server.0')) {
        return cb(new Error('No server selected'))
      }
      debug({answers: answers})
      cb(null, answers.server)
    })
  }

  main (cargo, cb) {
    const opts = { args: {}, runtime: this.runtime }

    opts.args[this.bootCargo._selectHosts] = undefined
    // @todo command here for non-interactive/shell mode:
    // args.push "<cmd>"

    // @todo Can we use async.parallel to connect to all hosts at once?!

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
