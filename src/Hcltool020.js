'use strict'
// import chalk from 'chalk'
import _ from 'lodash'
import App from './App'
// import constants from './constants'

class HclTool020 extends App {
  exe (cb) {
    const hcltoolProps = _.find(this.runtime.deps, { name: 'pyhcl-0.2.0' })
    const defaults = {
      args: {},
      env: hcltoolProps.env || {},
      signatureOpts: { equal: '=', quote: '', dash: '-', escape: false },
      exe: hcltoolProps.exe
    }

    // defaults.env.TF_STATE = this.runtime.config.global.infra_state_file

    this._exe(defaults, cb)
  }
}

module.exports = HclTool020
