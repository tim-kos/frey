'use strict'
import Command from '../Command'
import chalk from 'chalk'
import _ from 'lodash'
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
    const appProps = _.find(this.runtime.prepare.deps, {name: 'terraformInventory'})
    const terraformInvExe = appProps.exe
    const args = []

    if (this.options.tags) {
      args.push(`--tags=${this.options.tags}`)
    }

    if (this.options.verbose) {
      args.push('-v')
    }

    // args.push "-vvvv"

    args.push(`--user=${this.runtime.compile.global.ssh.user}`)
    args.push(`--private-key=${this.runtime.compile.global.ssh.keyprv_file}`)

    const connection = this.cfg('global.connection')
    if (connection !== undefined) {
      args.push(`--connection=${connection}`)
      args.push(`--extra-vars="variable_host=${connection}"`)
      args.push(`--inventory-file="${connection},"`)
    } else {
      args.push(`--inventory-file=${terraformInvExe}`)
    }

    args.push('--sudo')
    args.push(`${this.runtime.compile.global.paths.playbookFile}`)

    return cb(null, args)
  }

  _gatherEnv (cargo, cb) {
    const env = {}

    if (!chalk.enalbed) {
      env.ANSIBLE_NOCOLOR = 'true'
    }

    env.ANSIBLE_CONFIG = this.runtime.compile.global.paths.ansibleCfg
    env.TF_STATE = this.runtime.compile.global.paths.stateFile

    return cb(null, env)
  }

  main (cargo, cb) {
    const appProps = _.find(this.runtime.prepare.deps, {name: 'ansible'})
    const ansiblePlaybookExe = appProps.cmdPlaybook
    let cmd = [
      ansiblePlaybookExe
    ]
    cmd = cmd.concat(this.bootCargo._gatherArgs)
    cmd = cmd.join(' ')

    const opts = {
      env: this.bootCargo._gatherEnv
    }

    // debug({cmd: cmd, opts: opts})

    this._exeScript(cmd, opts, (err, stdout) => {
      if (err) {
        return cb(err)
      }

      return cb(null)
    })
  }
}

module.exports = Install
