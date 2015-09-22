debug = require("depurar")("frey")

class Frey
  @chain = [
    "init"
    "prepare"
    "refresh"
    "validate"
    "plan"
    "backup"
    "launch"
    "install"
    "deploy"
    "restart"
    "show"
  ]

  @commands =
    init      : "Make current project Frey aware"
    prepare   : "Install prerequisites"
    refresh   : "Refreshes current infra state and saves to terraform.tfstate"
    validate  : "Checks your docs"
    plan      : "Shows infra changes and saves in an executable plan"
    backup    : "Backs up server state"
    launch    : "Launches virtual machines at a provider"
    install   : "Runs Ansible to install software packages & configuration templates"
    deploy    : "Upload your own application(s)"
    restart   : "Restart your own application(s) and its dependencies"
    show      : "Displays active platform"
    restore   : "Restore latest state backup"
    remote    : "Execute a remote command - or opens console"
    facts     : "Show Ansible facts"

  constructor: (config) ->
    @config = config
    debug
      config: @config

  run: () ->
    debug "hi"

  init: () ->
    debug
      config: @config

module.exports = Frey
