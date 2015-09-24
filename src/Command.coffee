debug           = require("depurar")("frey")
{ spawn, exec } = require "child_process"
chalk           = require "chalk"
_               = require "lodash"
flatten         = require "flat"
inflection      = require "inflection"

class Command
  constructor: (name, config, runtime) ->
    @name    = name
    @config  = config
    @runtime = runtime
    @dir     = @config.recipe

  boot: (cb) ->
    cb null

  run: (cb) ->
    @_exeScript "#{@config.root}/bin/control.sh", [ @name ], cb

  _exeScript: (shellPath, shellArgs, cb) ->
    childEnv = {}

    childEnv = _.extend childEnv,
      process.env,
      @_toEnvFormat(@runtime, "runtime"),
      @_toEnvFormat(@config, "config")

    debug "cd #{@dir}"
    opts =
      cwd  : @dir
      env  : childEnv
      stdio: [ "ignore", "pipe", "pipe" ]

    cmdArgs = [
      "-o", "pipefail"
      "-o", "errexit"
      "-o", "nounset"
      shellPath
    ]

    cmdArgs = cmdArgs.concat shellArgs


    process.stdout.write chalk.gray "--> "
    process.stdout.write chalk.green "#{@name}"
    process.stdout.write chalk.green "\n"

    bash       = spawn "bash", cmdArgs, opts
    lastStderr = []
    lastStdout = []

    bash.stdout.on "data", (data) ->
      if data?
        lastStdout.push "#{data}"
        lastStdout = _.takeRight lastStdout, 3

      process.stdout.write chalk.gray(data)

    bash.stderr.on "data", (data) ->
      if data?
        lastStderr.push "#{data}"
        lastStderr = _.takeRight lastStderr, 3

      process.stdout.write chalk.red(data)

    bash.on "close", (code) ->
      if code != 0
        msg = "Script '#{shellPath} #{shellArgs.join(" ")}' exited with code: '#{code}'"
        err = new Error msg

        if lastStderr.length
          lastInfo = lastStderr
        else
          lastInfo = lastStdout

        err.details = lastInfo.join()
        return cb err

      cb null

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
