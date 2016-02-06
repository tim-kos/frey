'use strict'
import Command from '../Command'
// import depurar from 'depurar'; const debug = depurar('frey')

class Validate extends Command {
  main (cargo, cb) {
    if (!(this.runtime.paths.recipeGit != null)) {
      const msg = 'Frey requires recipe (and state) to be under Git, and residu to be ignored.'
      return cb(new Error(msg))
    }

    return cb(null)
  }
}

module.exports = Validate
