'use strict'
import depurar from 'depurar'; const debug = depurar('frey')
import chalk from 'chalk'
import { spawn } from 'child_process'
import _ from 'lodash'
import yesno from 'yesno'
import Base from './Base'

class Shell extends Base {
  constructor (runtime) {
    super()
    this.runtime = runtime
  }

  _cmdYesNo (cmd, cb) {
    return this.promptYesNo(`May I run '${cmd}' for you? [yes|No]`, (ok) => {
      if (!ok) {
        return cb(new Error('Question declined. Aborting. '))
      }

      // cmd = [
      //   cmd
      // ]

      return this._exeScript(cmd, {}, (err, stdout) => {
        if (err) {
          return cb(new Error(`Error while executing '${cmd}'. ${err}`))
        }

        return cb(null)
      })
    })
  }

  promptYesNo (question, cb) {
    question = `--> ${question}`
    if (this.runtime.init.cliargs.forceYes) {
      this._out(`${question}\n`)
      this._out("<-- Answering Yes as '--force-yes' applies\n")
      return cb(true)
    }

    return yesno.ask(question, false, cb)
  }

  _buildChildEnv (extra = {}) {
    let childEnv = {}

    childEnv = _.extend(
      {},
      this.runtime.init.env,
      extra
    )

    // Automatically add all FREY_* environment variables to Terraform environment
    _.forOwn(this.runtime.init.env, (val, key) => {
      if (_.startsWith(key, 'FREY_')) {
        childEnv['TF_VAR_' + key] = val
      }
    })

    return childEnv
  }

  _exeScript (scriptArgs, cmdOpts, cb) {
    scriptArgs = [
      'bash',
      '-o', 'pipefail',
      '-o', 'errexit',
      '-o', 'nounset',
      '-c'
    ].concat(scriptArgs)

    return this._exe(scriptArgs, cmdOpts, cb)
  }

  _exe (cmdArgs, cmdOpts = {}, cb) {
    if (cmdOpts.env === undefined) { cmdOpts.env = {} }
    if (cmdOpts.verbose === undefined) { cmdOpts.verbose = true }
    if (cmdOpts.stdin === undefined) { cmdOpts.stdin = 'ignore' }
    if (cmdOpts.stdout === undefined) { cmdOpts.stdout = 'pipe' }
    if (cmdOpts.stderr === undefined) { cmdOpts.stderr = 'pipe' }
    if (cmdOpts.limitSamples === undefined) { cmdOpts.limitSamples = 3 }

    let dir = this.dir || this.runtime.init.cliargs.projectDir

    const opts = {
      cwd: dir,
      env: this._buildChildEnv(cmdOpts.env),
      stdio: [ cmdOpts.stdin, cmdOpts.stdout, cmdOpts.stderr ]
    }

    debug(this._secureOutput({
      // opts: opts
      cwd: opts.cwd,
      cmdArgs: cmdArgs
    }))

    const cmd = cmdArgs.shift()
    const bash = spawn(cmd, cmdArgs, opts)
    let lastStderr = []
    let lastStdout = []

    if (bash.stdout) {
      bash.stdout.on('data', (data) => {
        if (data) {
          lastStdout.push(`${data}`)
          if (cmdOpts.limitSamples) {
            lastStdout = _.takeRight(lastStdout, cmdOpts.limitSamples)
          }
        }

        if (cmdOpts.verbose) {
          return this._out(chalk.gray(data))
        }
      })
    }

    if (bash.stderr) {
      bash.stderr.on('data', (data) => {
        if (data) {
          lastStderr.push(`${data}`)
          if (cmdOpts.limitSamples) {
            lastStderr = _.takeRight(lastStderr, cmdOpts.limitSamples)
          }
        }

        if (cmdOpts.verbose) {
          return this._out(chalk.red(data))
        }
      })
    }

    return bash.on('close', code => {
      if (code !== 0) {
        const msg = `Script '${cmd} ${cmdArgs.join(' ')}' exited with code: '${code}'`
        const err = new Error(msg)
        let lastInfo

        if (lastStderr.length) {
          lastInfo = lastStderr
        } else {
          lastInfo = lastStdout
        }

        err.details = lastInfo.join('')
        return cb(err)
      }

      return cb(null, lastStdout.join(''))
    })
  }
}

module.exports = Shell