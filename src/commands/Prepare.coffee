Command         = require "../Command"
mkdirp          = require "mkdirp"
semver          = require "semver"
async           = require "async"
debug           = require("depurar")("frey")
{ spawn, exec } = require "child_process"

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
      name      : "terraform"
      range     : "#{@runtime.versions.terraform}"
      cmdVersion: "{exe} --version |head -n1 |awk '{print $NF}'"
      cmdInstall: [
        "cd #{@options.tools}"
        [
          "curl -sSL '"
          "https://dl.bintray.com/mitchellh/terraform/"
          "#{@runtime.paths.terraformZip}'"
          "> '#{@runtime.paths.terraformZip}'"
        ].join("")
        "unzip -o '#{@runtime.paths.terraformZip}'"
      ].join " && "
    ,
      type      : "app"
      name      : "terraformInventory"
      range     : "#{@runtime.versions.terraformInventory}"
      cmdVersion: "{exe} --version |head -n1 |awk '{print $NF \".0\"}'"
      cmdInstall: [
        "cd #{@options.tools}"
        [
          "curl -sSL '"
          "https://github.com/adammck/terraform-inventory/releases/download/"
          "v#{@runtime.versions.terraformInventory}/"
          "#{@runtime.paths.terraformInventoryZip}'"
          "> '#{@runtime.paths.terraformInventoryZip}'"
        ].join ""
        "unzip -o '#{@runtime.paths.terraformInventoryZip}'"
      ].join " && "
    ,
      type      : "app"
      name      : "pip"
      range     : ">= #{@runtime.versions.pip}"
      cmdVersion: "{exe} --version |head -n1 |awk '{print $2}'"
      cmdInstall: "sudo easy_install --upgrade pip"
    ,
      type      : "app"
      name      : "ansible"
      range     : "#{@runtime.versions.ansible}"
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

          debug "Directory for '#{props.name}' present at '#{props.dir}'"
          return nextCb null
      else if props.type == "app"
        @satisfy props, (satisfied) =>
          if satisfied
            return nextCb null

          @_cmdYesNo props.cmdInstall, (err) =>
            if err
              return nextCb new Error "Failed to install '#{props.name}'. #{err}"

            @satisfy props, (satisfied) ->
              if !satisfied
                msg = "Version of '#{props.name}' still not satisfied after install"
                return nextCb new Error msg

              nextCb null
      else
        return nextCb new Error "Unsupported type: '#{props.type}'"
    , cb

  satisfy: (props, cb) ->
    exePath    = @runtime.paths[props.name + "Exe"]
    cmdVersion = props.cmdVersion
    cmdVersion = cmdVersion.replace "{exe}", exePath
    exec cmdVersion, (err, stdout, stderr) =>
      if err
        # We don't want to bail out if version command does not exist yet
        # Or maybe --version returns non-zero exit code, which is common
        debug "Continuing after failed command #{cmdVersion}. #{stderr}"

      foundVersion = "#{stdout}".trim()

      debug
        exePath     :exePath
        foundVersion:foundVersion
        err         :err
        stdout      :stdout
        stderr      :stderr

      @_out "Found '#{props.name}' with version '#{foundVersion}'\n"

      if !semver.satisfies foundVersion, props.range
        @_out "#{props.name} needs to be installed or upgraded. \n"
        return cb false

      cb true

module.exports = Prepare
