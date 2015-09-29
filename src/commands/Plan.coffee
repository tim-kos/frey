Command = require "../Command"
debug   = require("depurar")("frey")

TOML    = require "toml"
fs      = require "fs"
async   = require "async"
glob    = require "glob"
YAML    = require "js-yaml"

class Plan extends Command

  boot: [
    "findTomlFiles"
    "readTomlFiles"
  ]

  findTomlFiles: (cb) ->
    debug "HEY"
    @tomlFiles = []
    glob "#{@options.recipe}/*.toml", options, (err, files) =>
      if err
        return cb err
      @tomlFiles.concat files
      cb null

  readTomlFiles: (cb) ->
    @tomlContents = []
    async.map @tomlFiles, fs.readFile, (err, results) =>
      if err
        return cb err
      @tomlContents = results
      cb null

  run: (cb) ->
    debug
      tomlContents: @tomlContents
      tomlFiles   : @tomlFiles

    # if @tomlExists
    #   buf    = fs.readFileSync @tomlExists, "utf-8"
    #
    #   recipe = TOML.parse buf
    #   fs.writeFileSync "#{@options.recipe}/ansible.yml", YAML.safeDump recipe.ansible
    #   fs.writeFileSync "#{@options.recipe}/terraform.json",
    #     JSON.stringify recipe.terraform, null, "  "
    #
    #   debug @options
    return cb null

module.exports = Plan
