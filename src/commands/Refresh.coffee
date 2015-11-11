Command = require "../Command"
debug   = require("depurar")("frey")
chalk   = require "chalk"
glob    = require "glob"
async   = require "async"
fs      = require "fs"
_       = require "lodash"
INI     = require "ini"
YAML    = require "js-yaml"
TOML    = require "toml"

class Refresh extends Command
  boot: [
    "_findTomlFiles"
    "_readTomlFiles"
    "_mergeToml"
    "_splitToml"
    "_gatherTerraformArgs"
  ]

  _findTomlFiles: (cargo, cb) ->
    tomlFiles = []
    pattern   = "#{@options.recipe}/*.toml"
    debug "Reading from '#{pattern}'"
    glob pattern, (err, files) ->
      if err
        return cb err

      tomlFiles = files
      cb null, tomlFiles

  _readTomlFiles: (tomlFiles, cb) ->
    tomlContents = []
    async.map tomlFiles, fs.readFile, (err, buf) ->
      if err
        return cb err

      tomlContents.push TOML.parse "#{buf}"
      cb null, tomlContents

  _mergeToml: (tomlContents, cb) ->
    tomlMerged = {}
    for tom in tomlContents
      tomlMerged = _.extend tomlMerged, tom

    cb null, tomlMerged

  _splitToml: (tomlMerged, cb) ->
    filesWritten = []

    async.series [
      (callback) =>
        if !tomlMerged.infra?
          debug "No infra instructions found in merged toml"
          return callback null # That's not fatal

        encoded = JSON.stringify tomlMerged.infra, null, "  "
        if !encoded
          return callback new Error "Unable to convert recipe to infra json"

        filesWritten.push @runtime.paths.infraFile
        fs.writeFile @runtime.paths.infraFile, encoded, callback
      (callback) =>
        if !tomlMerged.install?.config?
          debug "No install config instructions found in merged toml"
          return callback null # That's not fatal

        encoded = INI.encode tomlMerged.install.config
        if !encoded
          return callback new Error "Unable to convert recipe to install ini"

        filesWritten.push @runtime.paths.ansibleCfg
        fs.writeFile @runtime.paths.ansibleCfg, encoded, callback
      (callback) =>
        if !tomlMerged.install?.playbooks?
          debug "No install playbook instructions found in merged toml"
          return callback null # That's not fatal

        encoded = YAML.safeDump tomlMerged.install.playbooks
        if !encoded
          return callback new Error "Unable to convert recipe to install yml"

        filesWritten.push @runtime.paths.playbookFile
        fs.writeFile @runtime.paths.playbookFile, encoded, callback
    ], (err) ->
      if err
        return cb err

      cb null, filesWritten

  _gatherTerraformArgs: (filesWritten, cb) ->
    terraformArgs = []
    if !chalk.enabled
      terraformArgs.push "-no-color"

    terraformArgs.push "-state=#{@runtime.paths.stateFile}"

    cb null, terraformArgs

  main: (cargo, cb) ->
    terraformExe = (dep.exe for dep in @runtime.deps when dep.name == "terraform")[0]
    cmd          = [
      terraformExe
      "refresh"
    ]
    cmd = cmd.concat @bootCargo._gatherTerraformArgs

    @_exe cmd, verbose: false, limitSamples: false, (err, stdout) ->
      if err
        if "#{err.details}".match /when there is existing state/
          debug "Ignoring refresh error about missing statefile"
          return cb null
        else
          return cb err

      cb null

module.exports = Refresh
