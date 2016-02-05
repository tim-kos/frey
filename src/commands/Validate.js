var Command = require('../Command')
var debug = require('depurar')('frey')

class Validate extends Command {
  main (cargo, cb) {
    if (!(this.runtime.paths.recipeGit != null)) {
      var msg = 'Frey requires recipe (and state) to be under Git, and residu to be ignored.'
      return cb(new Error(msg))
    }

    return cb(null)
  }
}

module.exports = Validate
