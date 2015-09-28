Command = require "../Command"
mkdirp  = require "mkdirp"
debug   = require("depurar")("frey")

# - [ ] Create tooldir
# - [ ] Install Terraform
# - [ ] Install Ansible
# - [ ] Install Terraforminventory

class Prepare extends Command
  constructor: (name, options, runtime) ->
    super name, options, runtime
    @dir = @options.directory

  run: (cb) ->
    mkdirp @options.tools, (err) =>
      if err
        return cb err

      super cb

module.exports = Prepare
