chalk = require "chalk"
util  = require "util"
async = require "async"
_     = require "lodash"
debug = require("depurar")("frey")

class Base
  boot: []

  main: (bootOptions, cb) ->
    debug "You should override this with main class logic. "

  run: (cb)->
    methods = []
    for method in @boot
      methods.push this[method].bind(this)

    methods.unshift async.constant(@options)

    async.waterfall methods, (err, bootOptions) =>
      if err
        return cb err

      @main bootOptions, cb

  _out: (args...) ->
    index = 0
    str   = args[0]
    str   = "#{str}".replace /%[o%s]/, (m) ->
      if m == "%%"
        return m

      index++
      ret = (_.pullAt args, index)[0]
      ret = util.inspect ret, colors: chalk.supportsColor

      if m == "%o"
        ret = ret.replace /\s*\n\s*/g, " "

      return ret

    process.stdout.write "#{str}"

module.exports = Base
