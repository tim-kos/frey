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


    cb null


  run: (cb) ->
    debug
      tomlContents : @tomlContents
      tomlFiles    : @tomlFiles
      filesWritten : @filesWritten
      options      : @options
      runtime      : @runtime

    # __planFile="${FREY__OPTIONS__RECIPE}/terraform.plan"
    #
    # terraformArgs="${terraformArgs} -var ${var}=${!var}"
    #   rm -f "${__planFile}"
    #
    #   bash -c ""${__terraformExe}" plan -refresh=false ${terraformArgs} -out "${__planFile}""

    terraformArgs = []
    terraformArgs.push "-var x=y"

    __terraformExe = "#{@options.tools}/terraform/terraform"
    __planFile     = "#{@options.recipe}/terraform.plan"
    cmd = [
      __terraformExe
      "plan"
      "-refresh=false"
      "-out=#{__planFile}"
    ]
    cmd = cmd.concat terraformArgs
    cmd = cmd.join " "

    @_exeScript ["-c"], [ cmd ], (err) ->
      if err
        return cb err

      cb null

module.exports = Plan
