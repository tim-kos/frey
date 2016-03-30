'use strict'
import TerraformInventory from '../TerraformInventory'
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
    const terraformInventory = new TerraformInventory({
      args: {
        list: true
      },
      runtime: this.runtime
    })

    terraformInventory.exe((err, stdout) => {
      if (err) {
        return cb(err)
      }

      const trimmed = `${stdout}`.trim()
      if (!trimmed) {
        const msg = 'Unable to get \'terraformInventory\', this is a requirement to determine connection endpoints'
        return cb(new Error(msg))
      }

      const hosts = JSON.parse(trimmed)
      const filteredHosts = {}

      _.forOwn(hosts, (ips, name) => {
        if (name.indexOf('.') === -1) {
          return
        }
        if (name.indexOf('_') !== -1) {
          return
        }
        ips.forEach((ip) => {
          filteredHosts[ip] = name
        })
      })

      return cb(null, filteredHosts)
    })
  }

  _selectHosts (cargo, cb) {
    // Don't offer a choice if it's just one host
    if (Object.keys(this.bootCargo._gatherHosts).length === 1) {
      let selectedHosts = []
      let ip = Object.keys(this.bootCargo._gatherHosts)[0]
      let hostname = this.bootCargo._gatherHosts[ip]
      selectedHosts.push(ip)
      debug('Automatically selected host ' + hostname + 'because there is just one')
      return cb(null, selectedHosts)
    }

    // https://www.npmjs.com/package/inquirer
    const choices = []
    _.forOwn(this.bootCargo._gatherHosts, (hostname, ip) => {
      choices.push({
        name: hostname,
        value: ip
      })
    })

    const question = {
      type: 'list',
      name: 'server',
      message: 'Select server',
      choices: choices
    }
    inquirer.prompt(question, (answers) => {
      if (!_.has(answers, 'server')) {
        return cb(new Error('No server selected'))
      }
      cb(null, [ answers.server ])
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
