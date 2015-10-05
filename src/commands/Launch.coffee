Command = require "../Command"
debug   = require("depurar")("frey")
chalk   = require "chalk"

class Launch extends Command
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
      "apply"
    ]
    cmd = cmd.concat terraformArgs
    cmd = cmd.join " "

    @_exeScript ["-c", cmd], verbose: true, limitSamples: false, (err, stdout) =>
      if err
        return cb err

      @_out "--> Saved state to '#{@runtime.paths.stateFile}'\n"

      cb null

module.exports = Launch
