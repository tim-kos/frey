Command = require "../Command"
mkdirp  = require "mkdirp"
debug   = require("depurar")("frey")

# - [ ] Create tooldir
# - [ ] Install Terraform
# - [ ] Install Ansible
# - [ ] Install Terraforminventory

class Prepare extends Command
  constructor: (name, config, runtime) ->
    super
    @dir = @config.directory
    debug @dir

  run: (cb) ->
    mkdirp @config.tools, (err) ->
      if err
        return cb err

      super()
      cb()

module.exports = Prepare
