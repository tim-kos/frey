Command = require "../Command"
mkdirp  = require "mkdirp"
debug   = require("depurar")("frey")

# - [ ] Create tooldir
# - [ ] Install Terraform
# - [ ] Install Ansible
# - [ ] Install Terraforminventory

class Prepare extends Command
  constructor: (name, config, runtime) ->
    super name, config, runtime
    @dir = @config.directory

  run: (cb) ->
    mkdirp @config.tools, (err) =>
      if err
        return cb err

      super cb

module.exports = Prepare
