'use strict'
import Command from '../Command'
// import depurar from 'depurar'; const debug = depurar('frey')

class Validate extends Command {
  main (cargo, cb) {
    if (!this.runtime.init.paths.git_dir) {
      const msg = 'Frey requires project (and state) to be under Git, and residu to be ignored.'
      return cb(new Error(msg))
    }

    return cb(null)
  }
}

module.exports = Validate
