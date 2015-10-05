Command = require "../Command"
debug   = require("depurar")("frey")
chalk   = require "chalk"

class Refresh extends Command
  boot: [
    "_gatherTerraformArgs"
  ]

  _gatherTerraformArgs: (filesWritten, cb) ->
    terraformArgs = []
    if !chalk.enabled
      terraformArgs.push "-no-color"

    terraformArgs.push "-state=#{@runtime.paths.stateFile}"

    cb null, terraformArgs

  main: (terraformArgs, cb) ->
    tfExe = (dep.exe for dep in @runtime.deps when dep.name == "terraform")[0]
    cmd   = [
      tfExe
      "refresh"
    ]
    cmd = cmd.concat terraformArgs
    cmd = cmd.join " "

    @_exeScript ["-c", cmd], verbose: false, maxSamples: false, (err, stdout) =>
      if err
        if "#{err.details}".match /when there is existing state/
          debug "Ignoring refresh error about missing statefile"
          return cb null
        else
          return cb err

      @_out "--> Refreshed state to '#{@runtime.paths.stateFile}'\n"

      cb null

module.exports = Refresh
