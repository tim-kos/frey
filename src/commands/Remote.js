'use strict'
import Terraform from '../Terraform'
import Ssh from '../Ssh'
import Command from '../Command'
import inquirer from 'inquirer'
import async from 'async'
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
    // Don't offer a choice if it's just one host
    if (this.bootCargo._gatherHosts.length === 1) {
      return cb(null, this.bootCargo._gatherHosts)
    }

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
      debug({answers: answers})
      if (!_.has(answers, 'server.0')) {
        return cb(new Error('No server selected'))
      }
      if (answers.server.indexOf('all') > -1) {
        return cb(null, this.bootCargo._gatherHosts)
      }
      cb(null, answers.server)
    })
  }

  _connect (host, cb) {
    const opts = { args: {}, runtime: this.runtime }
    opts.args[host] = undefined

    // @todo command here for non-interactive/shell mode:
    // args.push "<cmd>"

    const ssh = new Ssh(opts)
    ssh.exe((err, stdout) => {
      if (err) {
        return cb(err)
      }

      return cb(null)
    })
  }

  main (cargo, cb) {
    const hosts = _.cloneDeep(this.bootCargo._selectHosts)

    async.map(hosts, this._connect.bind(this), (err, results) => {
      if (err) {
        return cb(err)
      }

      this._out(`--> Closed console to '${hosts.join(', ')}'\n`)
      return cb(null)
    })
  }
}

module.exports = Remote
