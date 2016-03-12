'use strict'
import chalk from 'chalk'
import _ from 'lodash'
import App from './App'

class Terraform extends App {
  constructor (opts) {
    super(opts)
  }

  exe (cb) {
    const terraformProps = _.find(this.runtime.prepare.deps, { name: 'terraform' })
    const defaults = {
      args: {},
      env: terraformProps.env,
      signatureOpts: { equal: '=', quote: '', dash: '-' },
      exe: terraformProps.exe
    }

    if (!chalk.enabled) {
      defaults.args['no-color'] = true
    }

    defaults.args['parallelism'] = this.runtime.config.global.terraformcfg.parallelism
    defaults.args['state'] = this.runtime.config.global.infra_state_file

    this._exe(defaults, cb)
  }
}

module.exports = Terraform
