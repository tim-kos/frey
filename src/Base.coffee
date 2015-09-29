chalk = require "chalk"
util  = require "util"
_     = require "lodash"

class Base
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
