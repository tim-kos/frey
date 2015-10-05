Command = require "../Command"
debug   = require("depurar")("frey")
mkdirp  = require "mkdirp"
async   = require "async"

# - [ ] Create Recipe dir
# - [ ] Create Recipe templates
# - [ ] Create Keys

class Init extends Command
  constructor: (name, options, runtime) ->
    super name, options, runtime
    @dir = @options.cwd

  main: (bootOptions, cb) ->
    mkdirp @options.recipe, (err) =>
      if err
        return cb err

      super bootOptions, cb

module.exports = Init
