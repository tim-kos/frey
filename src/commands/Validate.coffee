Command = require "../Command"
debug   = require("depurar")("frey")

class Validate extends Command
  main: (cargo, cb) ->
    if !@runtime.paths.recipeGit?
      msg = "Frey requires recipe (and state) to be under Git, and residu to be ignored."
      return cb new Error msg

    cb null

module.exports = Validate
