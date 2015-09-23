debug           = require("depurar")("frey")
{ spawn, exec } = require "child_process"
chalk           = require "chalk"

class Command
  constructor: (config, environment) ->
    @config      = config
    @environment = environment

  init: (cb) ->
    cb null

  run: (cb) ->
    cb null

  _exeScript: (shellPath, cb) ->
    inherit = ["PATH"]
    for key in inherit
      @environment[key] = process.env[key]

    opts =
      cwd  : @config.tools
      env  : @environment
      stdio: [ "ignore", "pipe", "pipe" ]

    debug opts

    bash = spawn("bash", [
      shellPath
      "-o", "pipefail"
      "-o", "errexit"
      "-o", "nounset"
    ], opts)

    bash.stdout.on "data", (data) ->
      console.log chalk.gray(data)

    bash.stderr.on "data", (data) ->
      console.log chalk.gray(data)

    bash.on "close", (code) ->
      if code != 0
        return cb new Error "Script '#{shellPath}' exited with code: '#{code}'"

      cb null

module.exports = Command
