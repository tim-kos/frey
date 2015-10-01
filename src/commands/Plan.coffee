Command = require "../Command"
debug   = require("depurar")("frey")

TOML    = require "toml"
fs      = require "fs"
_       = require "lodash"
async   = require "async"
glob    = require "glob"
YAML    = require "js-yaml"

class Plan extends Command
  boot: [
    "findTomlFiles"
    "readTomlFiles"
    "mergeToml"
    "splitToml"
    "gatherTerraformArgs"
  ]

  findTomlFiles: (cb) ->
    @tomlFiles = []
    pattern    = "#{@options.recipe}/*.toml"
    glob pattern, (err, files) =>
      if err
        return cb err

      @tomlFiles = files
      cb null

  readTomlFiles: (cb) ->
    @tomlContents = []
    async.map @tomlFiles, fs.readFile, (err, buf) =>
      if err
        return cb err

      @tomlContents.push TOML.parse "#{buf}"
      cb null

  mergeToml: (cb) ->
    @tomlMerged = {}
    for tom in @tomlContents
      @tomlMerged = _.extend @tomlMerged, tom

    cb null

  splitToml: (cb) ->
    @filesWritten = []

    async.parallel [
      (callback) =>
        encoded = JSON.stringify @tomlMerged.infra, null, "  "
        if !encoded
          return callback new Error "Unable to convert recipe to infra json"

        filePath = "#{@options.recipe}/infra.tf.json"
        @filesWritten.push filePath
        fs.writeFile filePath, encoded, callback
      (callback) =>
        encoded = YAML.safeDump @tomlMerged.config
        if !encoded
          return callback new Error "Unable to convert recipe to config yml"

        filePath = "#{@options.recipe}/config.yml"
        @filesWritten.push filePath
        fs.writeFile filePath, encoded, callback
    ], cb

  gatherTerraformArgs: (cb) ->
    @terraformArgs = []

    for key, val of @_buildChildEnv()
      if "#{key}".match /^FREY_[A-Z_0-9]+$/
        val = "#{val}"
        @terraformArgs.push "-var '#{key}=#{val.replace("'", "\\'")}'"

    cb null

  run: (cb) ->
    cmd = [
      @runtime.paths.terraformExe
      "plan"
      "-refresh=false"
      "-out=#{@runtime.paths.planFile}"
    ]
    cmd = cmd.concat @terraformArgs
    cmd = cmd.join " "

    @_exeScript ["-c"], [ cmd ], (err) =>
      if err
        return cb err

      @_out "--> Saved plan as '#{@runtime.paths.planFile}'\n"

      cb null

module.exports = Plan
