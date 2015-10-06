Command = require "../Command"
debug   = require("depurar")("frey")
fs      = require "fs"
chalk   = require "chalk"
_       = require "lodash"
async   = require "async"

class Plan extends Command
  boot: [
    "_gatherTerraformArgs"
  ]

  _gatherTerraformArgs: (options, cb) ->
    terraformArgs = []
    if !chalk.enabled
      terraformArgs.push "-no-color"

    terraformArgs.push "-refresh=false"
    terraformArgs.push "-out=#{@runtime.paths.planFile}"
    terraformArgs.push "-state=#{@runtime.paths.stateFile}"

    cb null, terraformArgs

  main: (cargo, cb) ->
    terraformExe = (dep.exe for dep in @runtime.deps when dep.name == "terraform")[0]
    cmd          = [
      terraformExe
      "plan"
    ]
    cmd = cmd.concat @bootCargo._gatherTerraformArgs
    cmd = cmd.join " "

    @_exeScript ["-c", cmd], {}, (err, stdout) =>
      if err
        return cb err

      @_out "--> Saved plan as '#{@runtime.paths.planFile}'\n"

      if stdout.match /No changes/
        return cb null

      m = stdout.match /Plan: (\d+) to add, (\d+) to change, (\d+) to destroy/
      if !m
        return cb new Error "Unable to parse add/change/destroy"

      [ _, add, change, destroy ] = m

      @runtime.launchPlan =
        add    :add
        change :change
        destroy:destroy

      cb null

module.exports = Plan
