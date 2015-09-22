debug = require("depurar")()

# - init    : Make current project Frey aware
# - prepare : Install prerequisites
# - refresh : Refreshes current infra state and saves to terraform.tfstate
# - validate: Checks your docs
# - plan    : Shows infra changes and saves in an executable plan
# - backup  : Backs up server state
# - launch  : Launches virtual machines at a provider (if needed) using Terraform's ./infra.tf
# - install : Runs Ansible to install software packages & configuration templates
# - deploy  : Upload your own application(s)
# - restart : Restart your own application(s) and its dependencies
# - show    : Displays active platform

# - restore   : Restore latest state backup
# - remote    : Execute a remote command - or opens console
# - completion: Install frey cli auto completion
# - facts     : Show Ansible facts

# --unsafe Allow execution, even though your Git working directory is unclean
# --unsafe

class Frey
  run: () ->
    debug "hi"

  init: () ->
    debug "hi"

module.exports = Frey
