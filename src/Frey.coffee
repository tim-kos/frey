debug      = require("depurar")("frey")
inflection = require "inflection"
async      = require "async"
_          = require "lodash"
fs         = require "fs"
path       = require "path"
mkdirp     = require "mkdirp"
inflection = require "inflection"
flatten    = require "flat"

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

  _defaults: (cb) ->
    @config      ?= {}
    @config._    ?= []
    @config._[0] ?= "init"
    cb null

  _normalize: (cb) ->
    # Resolve interdependent arguments
    for key, val of @config
      if val == "#{val}"
        @config[key] = val.replace "{directory}", @config.directory

    # Apply simple functions
    for key, val of @config
      if "#{val}".match /\|basename$/
        val          = val.replace /\|basename$/, ""
        val          = path.basename val
        @config[key] = val

    cb null

  _validate: (cb) ->
    if !@config?.directory?
      return cb new Error "'#{@config?.directory?}' is not a valid directory"

    async.series [
      (callback) =>
        # Bail out with help if command does not exist
        if @config?._?[0] not of Frey.commands
          return callback new Error "'#{@config?._?[0]}' is not a supported Frey command"

        callback null
      (callback) =>
        # Need a local .git dir
        gitDir = "#{@config.directory}/.git"
        fs.stat gitDir, (err, stats) ->
          if err
            return callback new Error "Error while checking for '#{gitDir}'"

          if !stats.isDirectory()
            return callback new Error "'#{gitDir}' is not a directory"

          callback null
    ], cb

  _setup: (cb) ->
    async.parallel [
      (callback) =>
        mkdirp @config.tools, callback
    ], cb

  _filterChain: (cb) ->
    cmd   = @config._[0]
    index = Frey.chain.indexOf(cmd)

    if @config.bail
      length = index + 1
    else
      length = Frey.chain.length

    filteredChain = Frey.chain.slice index, length

    cb null, filteredChain

  _toEnvFormat: (obj, prefix) ->
    if !obj?
      return {}

    delimiter = "__"

    flat = flatten obj,
      delimiter: delimiter

    environment = {}
    for key, val of flat
      parts = []
      parts.push "FREY"

      if prefix?
        parts.push inflection.underscore(prefix).toUpperCase()

      parts.push inflection.underscore(key).toUpperCase()

      envKey              = parts.join delimiter
      envKey              = envKey.replace ".", "_"
      environment[envKey] = val

    return environment

  run: (cb) ->
    async.series [
      @_defaults.bind(this)
      @_normalize.bind(this)
      @_validate.bind(this)
      @_setup.bind(this)
      @_filterChain.bind(this)
    ], (err, data) =>
      if err
        return cb err

      filteredChain = data.pop()
      debug "Will run: %o", filteredChain

      classes     = {}
      environment = @_toEnvFormat @config
      methods     = []

      for command in filteredChain
        className        = inflection.classify command
        path             = "./commands/#{command}"
        classes[command] = new (require path) @config, environment

        for action in [ "init", "run" ]
          do (action) =>
            methods.push (callback) =>
              classes[command][action] (err, result) =>
                environment = _.extend environment, @_toEnvFormat(result, command)
                callback err

      async.series methods, cb

module.exports = Frey
