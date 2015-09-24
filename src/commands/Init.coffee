Command = require "../Command"
debug   = require("depurar")("frey")
mkdirp  = require "mkdirp"
async   = require "async"

# - [ ] Create Recipe dir
# - [ ] Create Recipe templates
# - [ ] Create Keys

class Init extends Command
  constructor: (name, config, runtime) ->
    super
    @dir = @config.directory

  run: (cb) ->
    mkdirp @config.recipe, (err) =>
      if err
        return cb err

      super cb

module.exports = Init
