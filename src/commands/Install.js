var Command = require('../Command')
var chalk = require('chalk')
var _ = require('lodash')
var debug = require('depurar')('frey')

class Install extends Command {
  constructor (name, options, runtime) {
    super(name, options, runtime)
    this.boot = [
      '_gatherArgs',
      '_gatherEnv'
    ]
  }

  _gatherArgs (cargo, cb) {
    var args = []
    var terraformInvExe = ((() => {
      var result = []
      var iterable = this.runtime.deps
      for (var i = 0, dep; i < iterable.length; i++) {
        dep = iterable[i]
        if (dep.name === 'terraformInventory') {
          result.push(dep.exe)
        }
      }
      return result
    })())[0]

    if (this.options.tags) {
      args.push(`--tags=${this.options.tags}`)
    }

    if (this.options.verbose) {
      args.push('-v')
    }
      // args.push "-vvvv"

    args.push(`--user=${this.runtime.ssh.user}`)
    args.push(`--private-key=${this.runtime.ssh.keyprv_file}`)
    args.push(`--inventory-file=${terraformInvExe}`)
    args.push('--sudo')
    args.push(`${this.runtime.paths.playbookFile}`)

    return cb(null, args)
  }

  _gatherEnv (cargo, cb) {
    var env = {}

    if (!chalk.enalbed) {
      env.ANSIBLE_NOCOLOR = 'true'
    }

    env.ANSIBLE_CONFIG = this.runtime.paths.ansibleCfg
    env.TF_STATE = this.runtime.paths.stateFile

    return cb(null, env)
  }

  main (cargo, cb) {
    var ansiblePlaybookExe = ((() => {
      var result = []
      var iterable = this.runtime.deps
      for (var i = 0, dep; i < iterable.length; i++) {
        dep = iterable[i]
        if (dep.name === 'ansible') {
          result.push(dep.exePlaybook)
        }
      }
      return result
    })())[0]
    var cmd = [
      ansiblePlaybookExe
    ]
    cmd = cmd.concat(this.bootCargo._gatherArgs)

    var opts =
      {env : this.bootCargo._gatherEnv}

    ; return this._exe(cmd, opts, function (err, stdout) {
      if (err) {
        return cb(err)
      }

      return cb(null)
    })
  }
}

module.exports = Install
