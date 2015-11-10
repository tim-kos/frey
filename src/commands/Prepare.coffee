Command  = require "../Command"
mkdirp   = require "mkdirp"
semver   = require "semver"
fs       = require "fs"
async    = require "async"
debug    = require("depurar")("frey")
Mustache = require "mustache"

class Prepare extends Command
  constructor: (name, options, runtime) ->
    super name, options, runtime
    @dir = @options.cwd

  main: (cargo, cb) ->
    async.eachSeries @runtime.deps, @_make.bind(this), cb

  _make: (props, cb) ->
    func = this["_make#{props.type}"]
    if !func
      return cb new Error "Unsupported dependency type: '#{props.type}'"

    func = func.bind(this)
    func props, cb

  _makePrivkey: (props, cb) ->
    fs.stat props.privkey, (err) =>
      if !err
        # Already exists
        debug "Key '#{props.privkey}' aready exists"
        return cb null

      @_out "Creating private key '#{props.privkey}'\n"
      cmd = [
        "ssh-keygen -b 2048 -t rsa -C '#{props.email}' -f '#{props.privkey}' -q -N ''"
        "rm -f '#{props.privkey}.pub'"
      ].join " && "
      @_exeScript cmd, verbose: true, limitSamples: false, cb

  _makePubkey: (props, cb) ->
    fs.stat props.pubkey, (err) =>
      if !err
        # Already exists
        debug "Key '#{props.pubkey}' aready exists"
        return cb null

      @_out "Creating public key '#{props.pubkey}'\n"
      cmd = [
        "echo -n $(ssh-keygen -yf '#{props.privkey}') > '#{props.pubkey}'"
        "echo ' #{props.email}' >> '#{props.pubkey}'"
      ].join " && "
      
      @_exeScript cmd, verbose: true, limitSamples: false, stdin: 0, cb

  _makePubkeyFingerprint: (props, cb) ->
    cmd = "ssh-keygen -lf '#{props.pubkey}' | awk '{print $2}'"
    @_exeScript cmd, verbose: false, limitSamples: false, (err, stdout) =>
      @runtime.ssh.keypub_fingerprint = "#{stdout}".trim()
      cb err

  _makeDir: (props, cb) ->
    mkdirp props.dir, (err) ->
      if err
        return cb err

      debug "Directory for '#{props.name}' present at '#{props.dir}'"
      return cb null

  _makeApp: (props, cb) ->
    @_satisfy props, (satisfied) =>
      if satisfied
        return cb null

      cmd = @_transform props.cmdInstall, props
      @_cmdYesNo cmd, (err) =>
        if err
          return cb new Error "Failed to install '#{props.name}'. #{err}"

        @_satisfy props, (satisfied) ->
          if !satisfied
            msg = "Version of '#{props.name}' still not satisfied after install"
            return cb new Error msg

          cb null

  _satisfy: (props, cb) ->
    cmd = @_transform props.cmdVersion, props

    @_exeScript cmd, verbose: false, limitSamples: false, (err, stdout) =>
      if err
        # We don't want to bail out if version command does not exist yet
        # Or maybe --version returns non-zero exit code, which is common
        debug
          msg         : "Continuing after failed command #{cmd}. #{err}"
          exe         :props.exe
          foundVersion:foundVersion
          err         :err
          stdout      :stdout

      foundVersion = "#{stdout}".trim().replace "v", ""
      @_out "Found '#{props.name}' with version '#{foundVersion}'\n"

      if !stdout || !semver.satisfies foundVersion, props.range
        @_out "'#{props.name}' needs to be installed or upgraded. \n"
        return cb false

      cb true

  _transform: (cmd, props) ->
    cmd = Mustache.render cmd, props
    return cmd

module.exports = Prepare
