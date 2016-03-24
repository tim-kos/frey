'use strict'
import chalk from 'chalk'
import _ from 'lodash'
import App from './App'
import fs from 'fs'

class Ansible extends App {
  exe (cb) {
    const terraformInvProps = _.find(this.runtime.prepare.deps, { name: 'terraformInventory' })
    const ansibleProps = _.find(this.runtime.prepare.deps, { name: 'ansible' })
    const defaults = {
      args: {},
      env: ansibleProps.env,
      signatureOpts: { equal: '=', quote: '', dash: '--', escape: false },
      exe: ansibleProps.exePlaybook
    }

    defaults.args['inventory-file'] = terraformInvProps.exe
    defaults.args['user'] = this.runtime.config.global.ssh.user
    defaults.args['private-key'] = this.runtime.config.global.ssh.privatekey_file

    if (this.runtime.init.cliargs.tags) {
      defaults.args['tags'] = this.runtime.init.cliargs.tags
    }

    if (this.runtime.init.cliargs.verbose) {
      defaults.args['-vvvvv'] = undefined
    }

    // @todo: Put in a JS date here if you want the same stamp on all machines in a cluster.
    // Also, make it so that extra-vars can be appended vs
    // overwritten further down already
    // defaults.args['extra-vars'] = 'ansistrano_release_version=$(date -u +%Y%m%d%H%M%SZ)'

    const connection = _.get(this.runtime, 'config.global.connection')
    if (connection !== undefined) {
      defaults.args['inventory-file'] = null
      defaults.args['user'] = null
      defaults.args['private-key'] = null
      defaults.args['connection'] = connection
      defaults.args['extra-vars'] = `variable_host=${connection}`
      defaults.args['inventory-file'] = `${connection},`
    } else {
      fs.stat(this.runtime.config.global.infra_state_file, (err) => {
        if (err) {
          return cb(new Error(`Can't find infra_state_file '${this.runtime.config.global.infra_state_file}'. Did you provision infra yet? `))
        }
      })
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
