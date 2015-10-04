Command = require "../Command"
debug   = require("depurar")("frey")
mkdirp  = require "mkdirp"
async   = require "async"

# - [ ] Create Recipe dir
# - [ ] Create Recipe templates
# - [ ] Create Keys

class Init extends Command
  constructor: (name, options, runtime) ->
    super
    @dir = @options.directory

  main: (bootOptions, cb) ->
    mkdirp @options.recipe, (err) =>
      if err
        return cb err

      super cb

module.exports = Init
