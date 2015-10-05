Command = require "../Command"
debug   = require("depurar")("frey")

class Validate extends Command
  main: (bootOptions, cb) ->
    if !@runtime.paths.stateGit?
      return cb new Error "Frey requires state to be under Git."

    cb null

module.exports = Validate
