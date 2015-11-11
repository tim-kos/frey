Command = require "../Command"
chalk   = require "chalk"
_       = require "lodash"
debug   = require("depurar")("frey")

class Remote extends Command
  boot: [
    "_gatherTerraformArgs"
    "_gatherHost"
    "_gatherArgs"
    "_gatherEnv"
  ]

  _gatherTerraformArgs: (options, cb) ->
    terraformArgs = []
    if !chalk.enabled
      terraformArgs.push "-no-color"

    terraformArgs.push "-state=#{@runtime.paths.stateFile}"

    cb null, terraformArgs

  _gatherHost: (cargo, cb) ->
    terraformExe = (dep.exe for dep in @runtime.deps when dep.name == "terraform")[0]
    cmd          = [
      terraformExe
      "output"
    ]
    cmd = cmd.concat @bootCargo._gatherTerraformArgs
    cmd = cmd.concat "public_address"

    @_exe cmd, {}, (err, stdout) ->
      if err
        return cb err

      host = "#{stdout}".split("\n")[0].trim()
      cb null, host

  _gatherArgs: (cargo, cb) ->
    args   = []

    debug cargo:cargo
    args.push "#{@bootCargo._gatherHost}"
    args.push "-i", "#{@runtime.ssh.keyprv_file}"
    args.push "-l", "#{@runtime.ssh.user}"
    args.push "-o", "UserKnownHostsFile=/dev/null"
    args.push "-o", "CheckHostIP=no"
    args.push "-o", "StrictHostKeyChecking=no"
    if @options.verbose
      args.push "-vvvv"

    # @todo command here for non-interactive/shell mode:
    # args.push "<cmd>"
    cb null, args

  _gatherEnv: (cargo, cb) ->
    env = {}

    cb null, env

  main: (cargo, cb) ->
    # sshExe = (dep.exe for dep in @runtime.deps when dep.name == "ssh")[0]
    sshExe = "ssh"
    cmd    = [
      sshExe
    ]
    cmd = cmd.concat @bootCargo._gatherArgs

    opts =
      env    : @bootCargo._gatherEnv
      stdin  : "inherit"
      stdout : "inherit"
      stderr : "inherit"

    debug
      opts:opts
      cmd:cmd

    @_exe cmd, opts, (err, stdout) ->
      if err
        return cb err

      cb null

module.exports = Remote
