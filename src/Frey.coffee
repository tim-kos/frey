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
osHomedir  = require "os-homedir"

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

  boot: [
    "_defaults"
    "_normalize"
    "_validate"
    "_setup"
    "_runtimeVars"
    "_filterChain"
  ]

  constructor: (options) ->
    @options         = options
    @runtime         = {}

  _defaults: (options, nextCb) ->
    options      ?= {}
    options._    ?= []
    options._[0] ?= "prepare"
    nextCb null, options

  _normalize: (options, nextCb) ->
    # Resolve interdependent arguments
    for key, val of options
      if val == "#{val}"
        options[key] = val.replace "{directory}", options.directory
        options[key] = val.replace "{home}", osHomedir()

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
    cmd        = options._[0]
    indexStart = Frey.chain.indexOf(cmd)

    if indexStart < 0
      # This command is not part of the chain
      options.filteredChain = [ cmd ]
    else
      if options.bail
        length = indexStart + 1
      else if options.bailAfter && Frey.chain.indexOf(options.bailAfter) > -1
        length = Frey.chain.indexOf(options.bailAfter) + 1
      else
        length = Frey.chain.length

      options.filteredChain = Frey.chain.slice indexStart, length

    nextCb null, options

  _runtimeVars: (options, nextCb) ->
    @runtime.os =
      platform             : os.platform()
      hostname             : os.hostname()
      arch                 : "#{os.arch()}".replace "x64", "amd64"

    @runtime.versions =
      ansible              : "1.9.2"
      terraform            : "0.6.3"
      terraformInventory   : "0.5"
      pip                  : "7.1.2"

    @runtime.paths =
      ansibleCfg           : "#{@options.directory}/ansible.cfg"
      planFile             : "#{@options.recipe}/terraform.plan"
      stateFile            : "#{@options.recipe}/terraform.tfstate"
      infraFile            : "#{@options.recipe}/infra.tf.json"
      playbookFile         : "#{@options.recipe}/config.yml"
      pythonLib            : "#{@options.tools}/pip/lib/python2.7/site-packages"
      ansibleExe           : "#{@options.tools}/pip/bin/ansible"

    @runtime.ssh =
      keypair_name         : "#{options.app}"
      user                 : "ubuntu"
      email                : "hello@#{options.app}"
      keyprv_file          : "#{options.recipe}/#{options.app}.pem"
      keypub_file          : "#{options.recipe}/#{options.app}.pub"
      # keypub_body: $(echo "$(cat "${ keypub_file: " 2>/dev/null)") || true
      # keypub_fingerprint: "$(ssh-keygen -lf ${@runtime.ssh_keypub_file} | awk '{print $2}')"


    @runtime.deps = []

    @runtime.deps.push
      type        : "dir"
      name        : "tools"
      dir         : "#{@options.tools}"

    @runtime.deps.push
      type        : "app"
      name        : "terraform"
      range       : "#{@runtime.versions.terraform}"
      exe         : "#{@options.tools}/terraform"
      zip         : [
        "terraform"
        @runtime.versions.terraform
        @runtime.os.platform
        "#{@runtime.os.arch}.zip"
      ].join "_"
      cmdVersion  : "{exe} --version |head -n1 |awk '{print $NF}'"
      cmdInstall  : [
        "cd #{@options.tools}"
        [
          "curl -sSL '"
          "https://dl.bintray.com/mitchellh/terraform/"
          "{zip}'"
          "> '{zip}'"
        ].join("")
        "unzip -o '{zip}'"
      ].join " && "

    @runtime.deps.push
      type        : "app"
      name        : "terraformInventory"
      range       : "#{@runtime.versions.terraformInventory}"
      exe         : "#{@options.tools}/terraform-inventory"
      zip         : [
        "terraform-inventory"
        @runtime.versions.terraformInventory
        @runtime.os.platform
        "#{@runtime.os.arch}.zip"
      ].join "_"
      cmdVersion  : "{exe} --version |head -n1 |awk '{print $NF \".0\"}'"
      cmdInstall  : [
        "cd #{@options.tools}"
        [
          "curl -sSL '"
          "https://github.com/adammck/terraform-inventory/releases/download/"
          "v#{@runtime.versions.terraformInventory}/"
          "{zip}'"
          "> '{zip}'"
        ].join ""
        "unzip -o '{zip}'"
      ].join " && "

    @runtime.deps.push
      type        : "app"
      name        : "pip"
      exe         : "pip"
      range       : ">= #{@runtime.versions.pip}"
      cmdVersion  : "{exe} --version |head -n1 |awk '{print $2}'"
      cmdInstall  : "sudo easy_install --upgrade pip"

    @runtime.deps.push
      type        : "app"
      name        : "ansible"
      range       : "#{@runtime.versions.ansible}"
      exe         : "#{@options.tools}/pip/bin/ansible-playbook"
      exePlaybook : "#{@options.tools}/pip/bin/ansible-playbook"
      cmdVersion  : "{exe} --version |head -n1 |awk '{print $NF}'"
      cmdInstall  : "
        pip install
        --install-option='--prefix=pip'
        --ignore-installed
        --force-reinstall
        --root '#{@options.tools}'
        --upgrade
        --disable-pip-version-check
        ansible==#{@runtime.versions.ansible}
      "

    nextCb null, options

  main: (bootOptions, cb) ->
    @options = bootOptions

    if @options.verbose > 0
      @_out "--> Will run: %o\n", @options.filteredChain
    else
      @_out "--> Will run: %o\n", @options.filteredChain

    async.eachSeries @options.filteredChain, @_runOne.bind(this), cb

  _runOne: (command, cb) ->
    className = inflection.classify command
    path      = "./commands/#{className}"
    obj       = new (require path) command, @options, @runtime
    func      = obj.run.bind(obj)

    @_out chalk.gray "--> "
    @_out chalk.gray "#{@runtime.os.hostname} - "
    @_out chalk.green "#{command}"
    @_out chalk.green "\n"

    func (err, result) =>
      append          = {}
      append[command] = result
      @runtime        = _.extend @runtime, append
      cb err

module.exports = Frey
