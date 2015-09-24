Command         = require "../Command"
os              = require "os"
debug           = require("depurar")("frey")

class Prepare extends Command
  init: (cb) ->
    cb null,
      os:
        platform: os.platform()
        hostname: os.hostname()
        arch    : "#{os.arch()}".replace "x64", "amd64"

module.exports = Prepare
