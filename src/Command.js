'use strict'
import depurar from 'depurar'; const debug = depurar('frey')
import chalk from 'chalk'
import { spawn } from 'child_process'
import _ from 'lodash'
import flatten from 'flat'
import inflection from 'inflection'
import fs from 'fs'
import yesno from 'yesno'
import Base from './Base'

class Command extends Base {
  constructor (name, runtime) {
    super()
    this.name = name
    this.runtime = runtime
  }

  cfg (path, val) {
    if (val === undefined) {
      return _.get(this.runtime, 'compile.' + path)
    }
    throw new Error('Saving config is not supported (ever?)')
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

  main (bootOptions, cb) {
    const runScript = `${this.runtime.init.cliargs.recipeDir}/${this.name}.sh`
    debug(`Checking for existance of '${runScript}'`)
    return fs.stat(runScript, (err, stat) => {
      if (!err) {
        return this._exeScript([runScript, this.name], {}, cb)
      }

      return cb(null)
    })
  }

  _buildChildEnv (extra = {}) {
    let childEnv = {}

    childEnv = _.extend(
      childEnv,
      this.runtime.init.env,
      this._toEnvFormat(this.runtime, 'runtime'),
      this._toEnvFormat(this.options, 'options')
    )

    childEnv['TF_VAR_FREY_OPENSTACK_TENANT_NAME'] = this.runtime.init.env.FREY_OPENSTACK_TENANT_NAME
    childEnv['TF_VAR_FREY_OPENSTACK_EXTERNAL_GATEWAY'] = this.runtime.init.env.FREY_OPENSTACK_EXTERNAL_GATEWAY
    childEnv['TF_VAR_FREY_OPENSTACK_PROJECT_NAME'] = this.runtime.init.env.FREY_OPENSTACK_PROJECT_NAME
    childEnv['TF_VAR_FREY_OPENSTACK_PASSWORD'] = this.runtime.init.env.FREY_OPENSTACK_PASSWORD
    childEnv['TF_VAR_FREY_OPENSTACK_AUTH_URL'] = this.runtime.init.env.FREY_OPENSTACK_AUTH_URL
    childEnv['TF_VAR_FREY__RUNTIME__SSH__USER'] = this.runtime.compile.global.ssh.user
    childEnv['TF_VAR_FREY__RUNTIME__SSH__KEYPUB_FILE'] = this.runtime.compile.global.ssh.keypub_file
    childEnv['TF_VAR_FREY__RUNTIME__SSH__KEYPRV_FILE'] = this.runtime.compile.global.ssh.keyprv_file

    for (const key in childEnv) {
      const val = childEnv[key]
      childEnv[`TF_VAR_${key}`] = val
    }

    childEnv = _.extend(childEnv, extra)

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

    let dir = this.dir || this.runtime.init.cliargs.recipeDir

    const opts = {
      cwd: dir,
      env: this._buildChildEnv(cmdOpts.env),
      stdio: [ cmdOpts.stdin, cmdOpts.stdout, cmdOpts.stderr ]
    }

    debug({
      // opts: opts
      cwd: opts.cwd,
      cmdArgs: cmdArgs
    })

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

  _toEnvFormat (obj, prefix = undefined) {
    if (!obj) {
      return {}
    }

    const delimiter = '__'

    const flat = flatten(obj, {delimiter: delimiter})

    const environment = {}
    for (const key in flat) {
      const val = flat[key]
      const parts = []
      parts.push('FREY')

      if (prefix) {
        parts.push(inflection.underscore(prefix).toUpperCase())
      }

      parts.push(inflection.underscore(key).toUpperCase())

      let envKey = parts.join(delimiter)
      envKey = envKey.replace('.', '_')
      environment[envKey] = val
    }

    return environment
  }
}

module.exports = Command
