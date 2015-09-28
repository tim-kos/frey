Command = require "../Command"
debug   = require("depurar")("frey")

TOML = require "toml"
fs   = require "fs"
YAML = require "js-yaml"

class Plan extends Command

  run: (cb) ->
    tomlFile = "#{@config.recipe}/infra.toml"
    fs.stat tomlFile, (err) =>
      if err
        return super cb
      else
        buf    = fs.readFileSync "#{@config.recipe}/infra.toml", "utf-8"
        recipe = TOML.parse buf
        fs.writeFileSync "#{@config.recipe}/ansible.yml", YAML.safeDump recipe.ansible
        fs.writeFileSync "#{@config.recipe}/terraform.json", JSON.stringify recipe.terraform

        debug @config
        return cb null

module.exports = Plan
