debug           = require("depurar")("frey")
{ spawn, exec } = require "child_process"
chalk           = require "chalk"
_               = require "lodash"
flatten         = require "flat"
inflection      = require "inflection"
fs              = require "fs"
yesno           = require "yesno"
Base            = require "./Base"

class Command extends Base
  constructor: (name, options, runtime) ->
    @name    = name
    @options = options
    @runtime = runtime
    @dir     = @options.residu

  _cmdYesNo: (cmd, cb) ->
    @promptYesNo "May I run '#{cmd}' for you? [yes|No]", (ok) =>
      if !ok
        return cb new Error "Question declined. Aborting. "

      # cmd = [
      #   cmd
      # ]

      @_exeScript cmd, {}, (err, stdout) ->
        if err
          return cb new Error "Error while executing '#{cmd}'. #{err}"

        return cb null

  promptYesNo: (question, cb) ->
    question = "--> #{question}"
    if @options.forceYes
      @_out "#{question}\n"
      @_out "<-- Answering Yes as '--force-yes' applies\n"
      return cb true

    yesno.ask question, false, cb

  main: (bootOptions, cb) ->
    runScript = "#{@options.recipe}/#{@name}.sh"
    debug "Checking for existance of '#{runScript}'"
    fs.stat runScript, (err, stat) =>
      if !err
        return @_exeScript [runScript, @name], {}, cb

      cb null

  _buildChildEnv: (extra) ->
    childEnv = {}

    childEnv = _.extend childEnv,
      process.env,
      @_toEnvFormat(@runtime, "runtime"),
      @_toEnvFormat(@options, "options")

    for key, val of childEnv
      childEnv["TF_VAR_#{key}"] = val

    childEnv.PYTHONPATH = @runtime.paths.pythonLib

    if extra?
      childEnv = _.extend childEnv, extra

    return childEnv

  _exeScript: (scriptArgs, cmdOpts, cb) ->
    scriptArgs = [
      "bash"
      "-o", "pipefail"
      "-o", "errexit"
      "-o", "nounset"
      "-c"
    ].concat scriptArgs

    @_exe scriptArgs, cmdOpts, cb

  _exe: (cmdArgs, cmdOpts, cb) ->
    cmdOpts              ?= {}
    cmdOpts.env          ?= {}
    cmdOpts.verbose      ?= true
    cmdOpts.stdin        ?= "ignore"
    cmdOpts.stdout       ?= "pipe"
    cmdOpts.stderr       ?= "pipe"
    cmdOpts.limitSamples ?= 3

    opts =
      cwd  : @dir
      env  : @_buildChildEnv cmdOpts.env
      stdio: [ cmdOpts.stdin, cmdOpts.stdout, cmdOpts.stderr ]

    # debug
    #   opts   :opts.stdio
    #   cmdArgs:cmdArgs

    cmd        = cmdArgs.shift()
    bash       = spawn cmd, cmdArgs, opts
    lastStderr = []
    lastStdout = []

    bash.stdout.on "data", (data) =>
      if data?
        lastStdout.push "#{data}"
        if cmdOpts.limitSamples
          lastStdout = _.takeRight lastStdout, cmdOpts.limitSamples

      if cmdOpts.verbose
        @_out chalk.gray(data)

    bash.stderr.on "data", (data) =>
      if data?
        lastStderr.push "#{data}"
        if cmdOpts.limitSamples
          lastStderr = _.takeRight lastStderr, cmdOpts.limitSamples

      if cmdOpts.verbose
        @_out chalk.red(data)

    bash.on "close", (code) ->
      if code != 0
        msg = "Script '#{cmd} #{cmdArgs.join(" ")}' exited with code: '#{code}'"
        err = new Error msg

        if lastStderr.length
          lastInfo = lastStderr
        else
          lastInfo = lastStdout

        err.details = lastInfo.join ""
        return cb err

      cb null, lastStdout.join ""

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

module.exports = Command
