Command = require "../Command"
debug   = require("depurar")("frey")
chalk   = require "chalk"

class Launch extends Command
  boot: [
    "_gatherTerraformArgs"
  ]

  _gatherTerraformArgs: (options, cb) ->
    terraformArgs = []
    if !chalk.enabled
      terraformArgs.push "-no-color"

    terraformArgs.push "-parallelism=#{@options.terraformParallelism}"
    terraformArgs.push "-state=#{@runtime.paths.stateFile}"

    cb null, terraformArgs

  main: (cargo, cb) ->
    terraformExe = (dep.exe for dep in @runtime.deps when dep.name == "terraform")[0]
    cmd          = [
      terraformExe
      "apply"
    ]
    cmd = cmd.concat @bootCargo._gatherTerraformArgs

    @_exe cmd, verbose: true, limitSamples: false, (err, stdout) =>
      if err
        return cb err

      @_out "--> Saved state to '#{@runtime.paths.stateFile}'\n"

      cb null

module.exports = Launch
