Command         = require "../Command"
os              = require "os"
debug           = require("depurar")("frey")

class Prepare extends Command
  init: (cb) ->
    cb null,
      "os.platform": os.platform()
      "os.arch"    : os.arch()

  run: (cb) ->
    @_exeScript "#{__dirname}/Prepare.sh", cb

module.exports = Prepare
