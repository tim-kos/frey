'use strict'
import Command from '../Command'
import chalk from 'chalk'
import depurar from 'depurar'; const debug = depurar('frey')
import _ from 'lodash'
import Shell from '../Shell'

class Remote extends Command {
  constructor (name, runtime) {
    super(name, runtime)
    this.shell = new Shell(runtime)
    this.boot = [
      '_gatherTerraformArgs',
      '_gatherHost',
      '_gatherArgs',
      '_gatherEnv'
    ]
  }

  _gatherTerraformArgs (options, cb) {
    const terraformArgs = []
    if (!chalk.enabled) {
      terraformArgs.push('-no-color')
    }

    terraformArgs.push(`-state=${this.runtime.config.global.infra_state_file}`)

    return cb(null, terraformArgs)
  }

  _gatherHost (cargo, cb) {
    const appProps = _.find(this.runtime.prepare.deps, {name: 'terraform'})
    const terraformExe = appProps.exe
    let cmd = [
      terraformExe,
      'output'
    ]
    cmd = cmd.concat(this.bootCargo._gatherTerraformArgs)
    cmd = cmd.concat('public_address')

    return this.shell._exe(cmd, {}, (err, stdout) => {
      if (err) {
        return cb(err)
      }

      const host = `${stdout}`.split('\n')[0].trim()
      return cb(null, host)
    })
  }

  _gatherArgs (cargo, cb) {
    const args = []

    debug({cargo: cargo})
    args.push(`${this.bootCargo._gatherHost}`)
    args.push('-i', `${this.runtime.config.global.ssh.privatekey_file}`)
    args.push('-l', `${this.runtime.config.global.ssh.user}`)
    args.push('-o', 'UserKnownHostsFile=/dev/null')
    args.push('-o', 'CheckHostIP=no')
    args.push('-o', 'StrictHostKeyChecking=no')
    if (this.runtime.init.cliargs.verbose) {
      args.push('-vvvv')
    }

    // @todo command here for non-interactive/shell mode:
    // args.push "<cmd>"
    return cb(null, args)
  }

  _gatherEnv (cargo, cb) {
    const env = {}

    return cb(null, env)
  }

  main (cargo, cb) {
    // sshExe = (dep.exe for dep in @runtime.deps when dep.name == "ssh")[0]
    const sshExe = 'ssh'
    let cmd = [
      sshExe
    ]
    cmd = cmd.concat(this.bootCargo._gatherArgs)

    const opts = {env: this.bootCargo._gatherEnv,
      stdin: 'inherit',
      stdout: 'inherit',
      stderr: 'inherit'
    }

    debug({
      opts: opts,
      cmd: cmd
    })

    return this.shell._exe(cmd, opts, (err, stdout) => {
      if (err) {
        return cb(err)
      }

      return cb(null)
    })
  }
}

module.exports = Remote
