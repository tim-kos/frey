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
    @dir     = @options.recipe

  boot: []

  _cmdYesNo: (cmd, cb) ->
    @promptYesNo "May I run '#{cmd}' for you? [yes|No]", (ok) =>
      if !ok
        return cb new Error "Question declined. Aborting. "

      cmd = [
        cmd
      ]

      @_exeScript ["-c", cmd], {}, (err, stdout) ->
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

  run: (cb) ->
    runScript = "#{@options.recipe}/#{@name}.sh"
    fs.stat runScript, (err, stat) =>
      if err
        @_out chalk.dim "Running default control.sh action as I found no '#{runScript}'"
        @_out chalk.dim "\n"
        runScript = "#{@options.root}/bin/control.sh"

      @_exeScript [runScript, @name], {}, cb

  _buildChildEnv: ->
    childEnv = {}

    childEnv = _.extend childEnv,
      process.env,
      @_toEnvFormat(@runtime, "runtime"),
      @_toEnvFormat(@options, "options")

    childEnv.PYTHONPATH = @runtime.paths.pythonLib

    return childEnv

  _exeScript: (shellArgs, argOpts, cb) ->
    argOpts ?= {}
    argOpts.verbose ?= true

    opts =
      cwd  : @dir
      env  : @_buildChildEnv()
      stdio: [ "ignore", "pipe", "pipe" ]

    cmdArgs = [
      "-o", "pipefail"
      "-o", "errexit"
      "-o", "nounset"
    ]

    cmdArgs    = cmdArgs.concat shellArgs
    bash       = spawn "bash", cmdArgs, opts
    lastStderr = []
    lastStdout = []

    bash.stdout.on "data", (data) =>
      if data?
        lastStdout.push "#{data}"
        lastStdout = _.takeRight lastStdout, 3

      if argOpts.verbose
        @_out chalk.gray(data)

    bash.stderr.on "data", (data) =>
      if data?
        lastStderr.push "#{data}"
        lastStderr = _.takeRight lastStderr, 3

      if argOpts.verbose
        @_out chalk.red(data)

    bash.on "close", (code) ->
      if code != 0
        msg = "Script '#{shellArgs.join(" ")}' exited with code: '#{code}'"
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
