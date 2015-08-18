debug = require("depurar")()

class Terrible
  run: () ->
    debug "hi"

module.exports = Terrible
