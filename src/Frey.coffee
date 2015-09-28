debug      = require("depurar")("frey")
inflection = require "inflection"
async      = require "async"
_          = require "lodash"
fs         = require "fs"
path       = require "path"
mkdirp     = require "mkdirp"
os         = require "os"

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

    docbuild  : "Build docs"
    restore   : "Restore latest state backup"
    remote    : "Execute a remote command - or opens console"

  constructor: (config) ->
    @config  = config
    @runtime = {}

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


    @config.directory = path.resolve @config.directory
    @config.recipe    = path.resolve @config.directory, @config.recipe
    @config.tools     = path.resolve @config.directory, @config.tools

    @config.root      = path.resolve "#{__dirname}/.."

    if !@config.tags?
      @config.tags = ""

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

    if index < 0
      return cb null, [ cmd ]
    else if @config.bail
      length = index + 1
    else
      length = Frey.chain.length

    filteredChain = Frey.chain.slice index, length

    cb null, filteredChain

  _runtimeVars: (cb) ->
    @runtime.os =
      platform    : os.platform()
      hostname    : os.hostname()
      arch        : "#{os.arch()}".replace "x64", "amd64"

    @runtime.ssh =
      keypair_name: "#{@config.app}"
      user        : "ubuntu"
      email       : "hello@#{@config.app}"
      keyprv_file : "#{@config.recipe}/#{@config.app}.pem"
      keypub_file : "#{@config.recipe}/#{@config.app}.pub"

      # keypub_body: $(echo "$(cat "${ keypub_file: " 2>/dev/null)") || true
      # keypub_fingerprint: "$(ssh-keygen -lf ${FREY__RUNTIME__SSH_KEYPUB_FILE} | awk '{print $2}')"

    cb()

  run: (cb) ->
    async.series [
      @_defaults.bind(this)
      @_normalize.bind(this)
      @_validate.bind(this)
      @_setup.bind(this)
      @_runtimeVars.bind(this)
      @_filterChain.bind(this)
    ], (err, data) =>
      if err
        return cb err

      filteredChain = data.pop()
      debug "Will run: %o", filteredChain

      classes = {}
      methods = []

      for command in filteredChain
        do (command) =>
          className        = inflection.classify command
          path             = "./commands/#{command}"
          classes[command] = new (require path) command, @config, @runtime

          for action in [ "boot", "run" ]
            do (action) =>
              methods.push (callback) =>
                classes[command][action] (err, result) =>
                  append          = {}
                  append[command] = result
                  @runtime        = _.extend @runtime, append
                  callback err

      async.series methods, cb

module.exports = Frey
