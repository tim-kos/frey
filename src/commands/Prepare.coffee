Command = require "../Command"
mkdirp  = require "mkdirp"
semver  = require "semver"
async   = require "async"
debug   = require("depurar")("frey")

class Prepare extends Command
  constructor: (name, options, runtime) ->
    super name, options, runtime
    @dir = @options.cwd

  _transform: (cmd, props) ->
    cmd = cmd.replace /{exe}/g, props.exe
    cmd = cmd.replace /{zip}/g, props.zip
    return cmd

  main: (bootOptions, cb) ->
    async.eachSeries @runtime.deps, (props, nextCb) =>
      if props.type == "dir"
        mkdirp props.dir, (err) ->
          if err
            return nextCb err

          debug "Directory for '#{props.name}' present at '#{props.dir}'"
          return nextCb null
      else if props.type == "app"
        @_satisfy props, (satisfied) =>
          if satisfied
            return nextCb null

          cmd = @_transform props.cmdInstall, props
          @_cmdYesNo cmd, (err) =>
            if err
              return nextCb new Error "Failed to install '#{props.name}'. #{err}"

            @_satisfy props, (satisfied) ->
              if !satisfied
                msg = "Version of '#{props.name}' still not satisfied after install"
                return nextCb new Error msg

              nextCb null
      else
        return nextCb new Error "Unsupported type: '#{props.type}'"
    , cb

  _satisfy: (props, cb) ->
    cmd = @_transform props.cmdVersion, props

    @_exeScript ["-c", cmd], {verbose: false}, (err, stdout) =>
      if err
        # We don't want to bail out if version command does not exist yet
        # Or maybe --version returns non-zero exit code, which is common
        debug
          msg         : "Continuing after failed command #{cmd}. #{err}"
          exe         :props.exe
          foundVersion:foundVersion
          err         :err
          stdout      :stdout

      foundVersion = "#{stdout}".trim().replace "v", ""
      @_out "Found '#{props.name}' with version '#{foundVersion}'\n"

      if !stdout || !semver.satisfies foundVersion, props.range
        @_out "#{props.name} needs to be installed or upgraded. \n"
        return cb false

      cb true

module.exports = Prepare
