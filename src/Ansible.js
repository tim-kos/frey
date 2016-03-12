'use strict'
import chalk from 'chalk'
import _ from 'lodash'
import App from './App'

class Ansible extends App {
  constructor (opts) {
    super(opts)
  }

  exe (cb) {
    const terraformInvProps = _.find(this.runtime.prepare.deps, { name: 'terraformInventory' })
    const ansibleProps = _.find(this.runtime.prepare.deps, { name: 'ansible' })
    const defaults = {
      args: {},
      env: ansibleProps.env,
      signatureOpts: { equal: '=', quote: '', dash: '--' },
      exe: ansibleProps.exePlaybook
    }

    defaults.args['inventory-file'] = terraformInvProps.exe
    defaults.args['user'] = this.runtime.config.global.ssh.user
    defaults.args['private-key'] = this.runtime.config.global.ssh.privatekey_file
    defaults.args['tags'] = this.runtime.init.cliargs.tags

    if (this.runtime.init.cliargs.tags) {
      defaults.args['tags'] = this.runtime.init.cliargs.tags
    }

    if (this.runtime.init.cliargs.verbose) {
      defaults.args['verbose'] = true
    }

    const connection = _.get(this.runtime, 'config.global.connection')
    if (connection !== undefined) {
      defaults.args['inventory-file'] = false
      defaults.args['user'] = false
      defaults.args['private-key'] = false
      defaults.args['connection'] = connection
      defaults.args['extra-vars'] = `variable_host=${connection}`
      defaults.args['inventory-file'] = `${connection},`
    }

    if (!chalk.enalbed) {
      defaults.env.ANSIBLE_NOCOLOR = 'true'
    }

    defaults.env.ANSIBLE_CONFIG = this.runtime.config.global.ansiblecfg_file
    defaults.env.TF_STATE = this.runtime.config.global.infra_state_file

    // The limit option tells Ansible to target only certain hosts.
    // if (this.runtime.init.cliargs.limit) {
    //   args.push(`limit=${this.runtime.init.cliargs.limit}`)
    // }
    //

    this._exe(defaults, cb)
  }
}

module.exports = Ansible
