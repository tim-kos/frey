debug      = require("depurar")("frey")
inflection = require "inflection"
async      = require "async"

class Frey
  @chain = [
    "prepare"
    "init"
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
    prepare   : "Install prerequisites"
    init      : "Make current project Frey aware"
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

  _filterChain: (cb) ->
    cmd = @config?._?[0]
    if !cmd
      return cb new Error("No command")

    index = Frey.chain.indexOf(cmd)
    if !cmd
      return cb new Error("No index")

    if @config.bail
      length = index + 1
    else
      length = Frey.chain.length

    filteredChain = Frey.chain.slice index, length

    cb null, filteredChain

  run: (cb) ->
    @_filterChain (err, filteredChain) =>
      debug "Will run: %o", filteredChain

      classes = {}
      data    = {}
      methods = []

      for command in filteredChain
        className        = inflection.classify command
        path             = "./commands/#{className}"
        classes[command] = new (require path) @config

        methods.push classes[command].init
        methods.push (callback) ->
          classes[command].run (err, result) ->
            data[command] = result
            callback err, result

      async.series methods, (err) ->
        debug
          err   :err
          data  :data

module.exports = Frey
