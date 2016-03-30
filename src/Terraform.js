'use strict'
import chalk from 'chalk'
import _ from 'lodash'
import App from './App'

class Terraform extends App {
  exe (cb) {
    const terraformProps = _.find(this.runtime.prepare.deps, { name: 'terraform' })
    const defaults = {
      args: {},
      env: terraformProps.env || {},
      signatureOpts: { equal: '=', quote: '', dash: '-', escape: false },
      exe: terraformProps.exe
    }

    if (!chalk.enabled) {
      defaults.args['no-color'] = true
    }

    if (this.runtime.init.cliargs.verbose) {
      defaults.env['TF_LOG'] = 'DEBUG'
    }

    defaults.args['parallelism'] = this.runtime.config.global.terraformcfg.parallelism
    defaults.args['state'] = this.runtime.config.global.infra_state_file

    this._exe(defaults, cb)
  }
}

module.exports = Terraform
