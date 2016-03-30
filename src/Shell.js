'use strict'
import depurar from 'depurar'; const debug = depurar('frey')
import chalk from 'chalk'
import { spawn } from 'child_process'
import _ from 'lodash'
import inquirer from 'inquirer'
import Base from './Base'

class Shell extends Base {
  constructor (runtime) {
    super()
    this.runtime = runtime
  }

  confirm (question, cb) {
    if (this.runtime.init.cliargs.forceYes) {
      this._out(`--> Skipping confirmation for '${question}' as '--force-yes' applies\n`)
      return cb(null)
    }

    inquirer.prompt({ type: 'confirm', name: 'confirmation', message: question, default: false }, (answers) => {
      if (_.get(answers, 'confirmation') !== true) {
        return cb(new Error('Question declined. Aborting. '))
      }

      return cb(null)
    })
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

  exeScript (scriptArgs, cmdOpts, cb) {
    scriptArgs = [
      'bash',
      '-o', 'pipefail',
      '-o', 'errexit',
      '-o', 'nounset',
      '-c'
    ].concat(scriptArgs)

    return this.exe(scriptArgs, cmdOpts, cb)
  }

  _debugCmd (env, args) {
    let debugCmd = ''
    _.forOwn(env, (val, key) => {
      if (process.env[key]) {
        return
      }
      if (key.indexOf('npm_config') === 0) {
        return
      }
      if (key.indexOf('MFLAGS') === 0) {
        return
      }
      if (key.indexOf('MAKEFLAGS') === 0) {
        return
      }
      if (key.indexOf('TF_VAR_') === 0) {
        return
      }
      if (key.indexOf('FREY_') === 0) {
        return
      }
      debugCmd += `${key}=${val} \\\n`
    })
    debugCmd += args.join(' \\\n  ') + ' \\\n|| false'

    debugCmd = debugCmd.replace(/\-o \\\n {2}/g, '-o ')
    return debugCmd
  }

  exe (cmdArgs, cmdOpts = {}, cb) {
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

    let debugCmd = this._debugCmd(opts.env, cmdArgs)
    debug(debugCmd)

    const cmd = cmdArgs.shift()
    const child = spawn(cmd, cmdArgs, opts)
    let lastStderr = []
    let lastStdout = []

    if (child.stdout) {
      child.stdout.on('data', (data) => {
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

    if (child.stderr) {
      child.stderr.on('data', (data) => {
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

    return child.on('close', (code) => {
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
