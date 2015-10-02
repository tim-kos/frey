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
      dir       : "@options.tools"
    ,
      type      : "app"
      name      : "ansible"
      range     : "> = 1.9.3 <2.0.0"
      cmdVersion: "{exe} --version |head -n1 |awk '{print $NF}'"
      cmdInstall: "sudo easy_install pip && sudo pip install ansible --upgrade"
    ]

    async.eachSeries @deps, (props, nextCb) =>
      if props.type == "dir"
        return mkdirp @options.tools, nextCb
      else if props.type == "app"
        cmdVersion = props.cmdVersion
        cmdVersion = cmdVersion.replace "{exe}", @runtime.paths[app + "Exe"]

        exec cmdVersion, (err, stdout, stderr) =>
          if err
            # We don't want to bail out if version command does not exist yet
            # Or maybe --version returns non-zero exit code, which is common
            debug "Continuing after failed command #{cmdVersion}. #{stderr}"

          foundVersion = "#{stdout}".trim()
          debug "Found ansible version '#{foundVersion}'"
          if semver.satisfies foundVersion, props.range
            cmd = props.cmdInstall
            # @todo Prompt "Dare I install"? With --force-yes override
            debug "Dare I installd"
            exec cmd, (err, stdout) =>
              if err
                return cb err
              @_out "--> #{stdout}\n"
              nextCb null
      else
        return nextCb new Error "Unsupported type: '#{props.type}'"
    , cb

module.exports = Prepare
