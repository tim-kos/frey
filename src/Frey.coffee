Depurar    = require("depurar")
debug      = Depurar("frey")
info       = Depurar("frey")
inflection = require "inflection"
async      = require "async"
util       = require "util"
_          = require "lodash"
fs         = require "fs"
path       = require "path"
mkdirp     = require "mkdirp"
os         = require "os"
chalk      = require "chalk"
Base       = require "./Base"

class Frey extends Base
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
    validate  : "Checks your recipes"
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

  constructor: (options) ->
    @options         = options
    @runtime         = {}
    @methodDelimiter = "->"

  _defaults: (options, nextCb) ->
    options      ?= {}
    options._    ?= []
    options._[0] ?= "init"
    nextCb null, options

  _normalize: (options, nextCb) ->
    # Resolve interdependent arguments
    for key, val of options
      if val == "#{val}"
        options[key] = val.replace "{directory}", options.directory

    # Apply simple functions
    for key, val of options
      if "#{val}".match /\|basename$/
        val          = val.replace /\|basename$/, ""
        val          = path.basename val
        options[key] = val


    options.directory = path.resolve options.directory
    options.recipe    = path.resolve options.directory, options.recipe
    options.tools     = path.resolve options.directory, options.tools

    options.root      = path.resolve "#{__dirname}/.."

    if !options.tags?
      options.tags = ""

    nextCb null, options

  _validate: (options, nextCb) ->
    if !options?.directory?
      return nextCb new Error "'#{options?.directory?}' is not a valid directory"

    async.series [
      (callback) ->
        # Bail out with help if command does not exist
        if options?._?[0] not of Frey.commands
          return callback new Error "'#{options?._?[0]}' is not a supported Frey command"

        callback null
      (callback) ->
        # Need a local .git dir
        gitDir = "#{options.directory}/.git"
        fs.stat gitDir, (err, stats) ->
          if err
            return callback new Error "Error while checking for '#{gitDir}'"

          if !stats.isDirectory()
            return callback new Error "'#{gitDir}' is not a directory"

          callback null
    ], (err) ->
      nextCb err, options

  _setup: (options, nextCb) ->
    async.parallel [
      (callback) ->
        mkdirp options.tools, callback
    ], (err) ->
      nextCb err, options

  _filterChain: (options, nextCb) ->
    cmd   = options._[0]
    index = Frey.chain.indexOf(cmd)


    if index < 0
      options.filteredChain = [ cmd ]
    else
      if options.bail
        length = index + 1
      else
        length = Frey.chain.length

      options.filteredChain = Frey.chain.slice index, length

    nextCb null, options

  _runtimeVars: (options, nextCb) ->
    @runtime.os =
      platform     : os.platform()
      hostname     : os.hostname()
      arch         : "#{os.arch()}".replace "x64", "amd64"

    @runtime.paths =
      terraformExe : "#{@options.tools}/terraform/terraform"
      planFile     : "#{@options.recipe}/terraform.plan"

    @runtime.ssh =
      keypair_name : "#{options.app}"
      user         : "ubuntu"
      email        : "hello@#{options.app}"
      keyprv_file  : "#{options.recipe}/#{options.app}.pem"
      keypub_file  : "#{options.recipe}/#{options.app}.pub"

      # keypub_body: $(echo "$(cat "${ keypub_file: " 2>/dev/null)") || true
      # keypub_fingerprint: "$(ssh-keygen -lf ${FREY__RUNTIME__SSH_KEYPUB_FILE} | awk '{print $2}')"

    nextCb null, options

  _runChain: (options, nextCb) ->
    @commands = {}
    methods   = []

    for command in options.filteredChain
      className          = inflection.classify command
      path               = "./commands/#{command}"
      obj                = new (require path) command, options, @runtime
      @commands[command] = obj
      actions            = @commands[command].boot.concat "run"

      for action in actions
        methods.push "#{command}#{@methodDelimiter}#{action}"

    if @options.verbose > 0
      @_out "--> Will run: %o\n", methods
    else
      @_out "--> Will run: %o\n", options.filteredChain

    async.eachSeries methods, @_runOne.bind(this), nextCb

  _runOne: (method, cb) ->
    [ command, action ] = method.split "#{@methodDelimiter}"
    obj                 = @commands[command]
    func                = obj[action].bind(obj)

    if @options.verbose > 0 || action == "run"
      @_out chalk.gray "--> "
      @_out chalk.gray "#{@runtime.os.hostname} - "
      @_out chalk.green "#{method}"
      @_out chalk.green "\n"

    func (err, result) =>
      if action == "run"
        append          = {}
        append[command] = result
        @runtime        = _.extend @runtime, append

      cb err

  run: (cb) ->
    async.waterfall [
      async.constant(@options)
      @_defaults.bind(this)
      @_normalize.bind(this)
      @_validate.bind(this)
      @_setup.bind(this)
      @_runtimeVars.bind(this)
      @_filterChain.bind(this)
      @_runChain.bind(this)
    ], (err, results) ->
      cb err

module.exports = Frey
