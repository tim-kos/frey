debug           = require("depurar")("frey")
{ spawn, exec } = require "child_process"
chalk           = require "chalk"
_               = require "lodash"

class Command
  constructor: (config, environment) ->
    @config      = config
    @environment = environment

  init: (cb) ->
    cb null

  run: (cb) ->
    cb null

  _exeScript: (shellPath, shellArgs, cb) ->
    inherit = ["PATH"]
    for key in inherit
      @environment[key] = process.env[key]

    opts =
      cwd  : @config.tools
      env  : @environment
      stdio: [ "ignore", "pipe", "pipe" ]

    cmdArgs = [
      "-o", "pipefail"
      "-o", "errexit"
      "-o", "nounset"
      shellPath
    ]

    cmdArgs.concat shellArgs

    debug
      cmdArgs:cmdArgs
      opts   :opts

    bash       = spawn "bash", cmdArgs, opts
    lastStderr = ""
    lastStdout = ""

    bash.stdout.on "data", (data) ->
      if data?
        lastStdout = "#{data}"
      console.log chalk.gray(data)

    bash.stderr.on "data", (data) ->
      if data?
        lastStderr = "#{data}"
      console.log chalk.red(data)

    bash.on "close", (code) ->
      if code != 0
        msg         = "Script '#{shellPath}' '#{shellArgs.join(", ")}' exited with code: '#{code}'"
        err         = new Error msg
        last3lines  = _.takeRight (lastStderr || lastStdout).split("\n"), 3
        err.details = last3lines.join "\n"
        return cb err

      cb null

module.exports = Command
