Command         = require "../Command"
debug           = require("depurar")("frey")
os              = require "os"
chalk           = require "chalk"
mkdirp          = require "mkdirp"
{ spawn, exec } = require "child_process"

class Prepare extends Command
  run: (cb) ->

    shellPath = "#{__dirname}/Prepare.sh"
    toolDir   = "#{@config.directory}/tools"

    mkdirp toolDir, (err) =>
      if err
        return new Error err

      opts =
        cwd: toolDir
        env: process.env
        stdio: [ "ignore", "pipe", "pipe" ]

      bash = spawn("bash", [
        shellPath
      ], opts)

      bash.stdout.on "data", (data) ->
        console.log chalk.gray(data)

      bash.stderr.on "data", (data) ->
        console.log chalk.gray(data)

      bash.on "close", (code) =>
        if code != 0
          return cb new Error "child process exited with code " + code

        debug @config
        cb null,
          "os.platform": os.platform()
          "os.arch"    : os.arch()




module.exports = Prepare
