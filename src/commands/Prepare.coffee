Command         = require "../Command"
mkdirp          = require "mkdirp"
semver          = require "semver"
async           = require "async"
debug           = require("depurar")("frey")
{ spawn, exec } = require "child_process"

# - [ ] Create tooldir
# - [ ] Install Terraform
# - [ ] Install Ansible
# - [ ] Install Terraforminventory

class Prepare extends Command
  constructor: (name, options, runtime) ->
    super name, options, runtime
    @dir = @options.directory

  run: (cb) ->
    deps = [
      type      : "dir"
      name      : "tools"
      dir       : "#{@options.tools}"
    ,
      type      : "app"
      name      : "pip"
      range     : ">= 6.0.8"
      cmdVersion: "{exe} --version |head -n1 |awk '{print $2}'"
      cmdInstall: "sudo easy_install pip"
    ,
      type      : "app"
      name      : "ansible"
      range     : ">= 1.9.2 <2.0.0"
      cmdVersion: "{exe} --version |head -n1 |awk '{print $NF}'"
      cmdInstall: "
        pip install
        --install-option='--prefix=pip'
        --ignore-installed
        --force-reinstall
        --root '#{@options.tools}'
        --upgrade
        --disable-pip-version-check
        ansible
      "
    ]

    async.eachSeries deps, (props, nextCb) =>
      if props.type == "dir"
        mkdirp props.dir, (err) ->
          if err
            return nextCb err
          else
            debug "Directory for '#{props.name}' present at '#{props.dir}'"
            return nextCb null
      else if props.type == "app"
        exePath    = @runtime.paths[props.name + "Exe"]
        cmdVersion = props.cmdVersion
        cmdVersion = cmdVersion.replace "{exe}", exePath

        exec cmdVersion, (err, stdout, stderr) =>
          if err
            # We don't want to bail out if version command does not exist yet
            # Or maybe --version returns non-zero exit code, which is common
            debug "Continuing after failed command #{cmdVersion}. #{stderr}"

          foundVersion = "#{stdout}".trim()
          debug "#{exePath}"
          @_out "Found '#{props.name}' with version '#{foundVersion}'\n"

          if !semver.satisfies foundVersion, props.range
            @_out "\n"
            @_out "#{props.name} needs to be installed or upgraded. \n"
            return @_cmdYesNo props.cmdInstall, nextCb

          return nextCb null
      else
        return nextCb new Error "Unsupported type: '#{props.type}'"
    , cb

module.exports = Prepare
