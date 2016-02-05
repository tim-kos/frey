var Command = require('../Command')
var chalk = require('chalk')
var _ = require('lodash')
var debug = require('depurar')('frey')

class Remote extends Command {
  constructor (name, options, runtime) {
    super(name, options, runtime)
    this.boot = [
      '_gatherTerraformArgs',
      '_gatherHost',
      '_gatherArgs',
      '_gatherEnv'
    ]
  }

  _gatherTerraformArgs (options, cb) {
    var terraformArgs = []
    if (!chalk.enabled) {
      terraformArgs.push('-no-color')
    }

    terraformArgs.push(`-state=${this.runtime.paths.stateFile}`)

    return cb(null, terraformArgs)
  }

  _gatherHost (cargo, cb) {
    var terraformExe = ((() => {
      var result = []
      var iterable = this.runtime.deps
      for (var i = 0, dep; i < iterable.length; i++) {
        dep = iterable[i]
        if (dep.name === 'terraform') {
          result.push(dep.exe)
        }
      }
      return result
    })())[0]
    var cmd = [
      terraformExe,
      'output'
    ]
    cmd = cmd.concat(this.bootCargo._gatherTerraformArgs)
    cmd = cmd.concat('public_address')

    return this._exe(cmd, {}, function (err, stdout) {
      if (err) {
        return cb(err)
      }

      var host = `${stdout}`.split('\n')[0].trim()
      return cb(null, host)
    })
  }

  _gatherArgs (cargo, cb) {
    var args = []

    debug({cargo:cargo})
    args.push(`${this.bootCargo._gatherHost}`)
    args.push('-i', `${this.runtime.ssh.keyprv_file}`)
    args.push('-l', `${this.runtime.ssh.user}`)
    args.push('-o', 'UserKnownHostsFile=/dev/null')
    args.push('-o', 'CheckHostIP=no')
    args.push('-o', 'StrictHostKeyChecking=no')
    if (this.options.verbose) {
      args.push('-vvvv')
    }

    // @todo command here for non-interactive/shell mode:
    // args.push "<cmd>"
    return cb(null, args)
  }

  _gatherEnv (cargo, cb) {
    var env = {}

    return cb(null, env)
  }

  main (cargo, cb) {
    // sshExe = (dep.exe for dep in @runtime.deps when dep.name == "ssh")[0]
    var sshExe = 'ssh'
    var cmd = [
      sshExe
    ]
    cmd = cmd.concat(this.bootCargo._gatherArgs)

    var opts =
      {env    : this.bootCargo._gatherEnv,
      stdin  : 'inherit',
      stdout : 'inherit',
      stderr : 'inherit'
      }

    debug({
      opts:opts,
      cmd:cmd
    })

    return this._exe(cmd, opts, function (err, stdout) {
      if (err) {
        return cb(err)
      }

      return cb(null)
    })
  }
}

module.exports = Remote
