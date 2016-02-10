'use strict'
import Command from '../Command'
import chalk from 'chalk'
// import _ from 'lodash'
// import depurar from 'depurar'; const debug = depurar('frey')

class Install extends Command {
  constructor (name, options, runtime) {
    super(name, options, runtime)
    this.boot = [
      '_gatherArgs',
      '_gatherEnv'
    ]
  }

  _gatherArgs (cargo, cb) {
    const args = []
    const terraformInvExe = ((() => {
      const result = []
      const iterable = this.runtime.deps
      for (let i = 0, dep; i < iterable.length; i++) {
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
    const env = {}

    if (!chalk.enalbed) {
      env.ANSIBLE_NOCOLOR = 'true'
    }

    env.ANSIBLE_CONFIG = this.runtime.paths.ansibleCfg
    env.TF_STATE = this.runtime.paths.stateFile

    return cb(null, env)
  }

  main (cargo, cb) {
    const ansiblePlaybookExe = ((() => {
      const result = []
      const iterable = this.runtime.deps
      for (let i = 0, dep; i < iterable.length; i++) {
        dep = iterable[i]
        if (dep.name === 'ansible') {
          result.push(dep.exePlaybook)
        }
      }
      return result
    })())[0]
    let cmd = [
      ansiblePlaybookExe
    ]
    cmd = cmd.concat(this.bootCargo._gatherArgs)

    const opts = {
      env: this.bootCargo._gatherEnv
    }

    this._exe(cmd, opts, (err, stdout) => {
      if (err) {
        return cb(err)
      }

      return cb(null)
    })
  }
}

module.exports = Install
