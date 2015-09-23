Command         = require "../Command"
os              = require "os"
debug           = require("depurar")("frey")

class Prepare extends Command
  init: (cb) ->
    cb null,
      "os.platform": os.platform()
      "os.arch"    : "#{os.arch()}".replace "x64", "amd64"

  run: (cb) ->
    @_exeScript "#{__dirname}/control.sh", ["prepare", "done"], cb

module.exports = Prepare
