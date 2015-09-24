Command         = require "../Command"
debug           = require("depurar")("frey")

# - [ ] Create Recipe dir
# - [ ] Create Recipe templates

class Init extends Command
  constructor: (name, config, runtime) ->
    super
    @dir = @config.directory

  run: (cb) ->
    mkdirp @config.recipe, (err) ->
      if err
        return cb err

      super

module.exports = Init
