Command = require "../Command"
debug   = require("depurar")("frey")

TOML  = require "toml"
fs    = require "fs"
chalk = require "chalk"
_     = require "lodash"
async = require "async"
glob  = require "glob"
YAML  = require "js-yaml"

class Plan extends Command
  boot: [
    "_findTomlFiles"
    "_readTomlFiles"
    "_mergeToml"
    "_splitToml"
    "_gatherTerraformArgs"
  ]

  _findTomlFiles: (options, cb) ->
    tomlFiles = []
    pattern   = "#{@options.recipe}/*.toml"
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

    async.parallel [
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
        if !tomlMerged.config?
          debug "No config instructions found in merged toml"
          return callback null # That's not fatal

        encoded = YAML.safeDump tomlMerged.config
        if !encoded
          return callback new Error "Unable to convert recipe to config yml"

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

    # terraformArgs.push "-var #{key}=#{val}"
    cb null, terraformArgs

  main: (terraformArgs, cb) ->
    tf  = (dep for dep in @runtime.deps when dep.name == "terraform")[0]
    cmd = [
      tf.exe
      "plan"
      "-refresh=false"
      "-out=#{@runtime.paths.planFile}"
    ]
    cmd = cmd.concat terraformArgs
    cmd = cmd.join " "

    @_exeScript ["-c", cmd], {}, (err, stdout) =>
      if err
        return cb err

      @_out "--> Saved plan as '#{@runtime.paths.planFile}'\n"

      cb null

module.exports = Plan
