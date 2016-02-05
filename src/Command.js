var debug = require('depurar')('frey')
var chalk = require('chalk')
var spawn = require('child_process').spawn
var _ = require('lodash')
var flatten = require('flat')
var inflection = require('inflection')
var fs = require('fs')
var yesno = require('yesno')
var Base = require('./Base')

class Command extends Base {
  constructor (name, options, runtime) {
    super()
    this.name = name
    this.options = options
    this.runtime = runtime
    this.dir = this.options.recipeDir
  }

  _cmdYesNo (cmd, cb) {
    return this.promptYesNo(`May I run '${cmd}' for you? [yes|No]`, (ok) => {
      if (!ok) {
        return cb(new Error('Question declined. Aborting. '))
      }

      // cmd = [
      //   cmd
      // ]

      return this._exeScript(cmd, {}, function (err, stdout) {
        if (err) {
          return cb(new Error(`Error while executing '${cmd}'. ${err}`))
        }

        return cb(null)
      })
    })
  }

  promptYesNo (question, cb) {
    question = `--> ${question}`
    if (this.options.forceYes) {
      this._out(`${question}\n`)
      this._out("<-- Answering Yes as '--force-yes' applies\n")
      return cb(true)
    }

    return yesno.ask(question, false, cb)
  }

  main (bootOptions, cb) {
    var runScript = `${this.options.recipeDir}/${this.name}.sh`
    debug(`Checking for existance of '${runScript}'`)
    return fs.stat(runScript, (err, stat) => {
      if (!err) {
        return this._exeScript([runScript, this.name], {}, cb)
      }

      return cb(null)
    })
  }

  _buildChildEnv (extra) {
    var childEnv = {}

    childEnv = _.extend(childEnv, process.env, this._toEnvFormat(this.runtime, 'runtime'), this._toEnvFormat(this.options, 'options'))

    for (var key in childEnv) {
      var val = childEnv[key]
      childEnv[`TF_VAR_${key}`] = val
    }

    childEnv.PYTHONPATH = this.runtime.paths.pythonLib

    if ((typeof extra !== 'undefined' && extra !== null)) {
      childEnv = _.extend(childEnv, extra)
    }

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

  _exe (cmdArgs, cmdOpts, cb) {
    if (!(typeof cmdOpts !== 'undefined' && cmdOpts !== null)) { cmdOpts = {} }
    if (!(cmdOpts.env != null)) { cmdOpts.env = {} }
    if (!(cmdOpts.verbose != null)) { cmdOpts.verbose = true }
    if (!(cmdOpts.stdin != null)) { cmdOpts.stdin = 'ignore' }
    if (!(cmdOpts.stdout != null)) { cmdOpts.stdout = 'pipe' }
    if (!(cmdOpts.stderr != null)) { cmdOpts.stderr = 'pipe' }
    if (!(cmdOpts.limitSamples != null)) { cmdOpts.limitSamples = 3 }

    var opts =
      {cwd: this.dir,
      env: this._buildChildEnv(cmdOpts.env),
      stdio: [ cmdOpts.stdin, cmdOpts.stdout, cmdOpts.stderr ]
      }

    debug({
      // opts: opts
      cwd: opts.cwd,
      cmdArgs: cmdArgs
    })

    var cmd = cmdArgs.shift()
    var bash = spawn(cmd, cmdArgs, opts)
    var lastStderr = []
    var lastStdout = []

    if (bash.stdout) {
      bash.stdout.on('data', (data) => {
        if ((typeof data !== 'undefined' && data !== null)) {
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
        if ((typeof data !== 'undefined' && data !== null)) {
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

    return bash.on('close', function (code) {
      if (code !== 0) {
        var msg = `Script '${cmd} ${cmdArgs.join(' ')}' exited with code: '${code}'`
        var err = new Error(msg)

        if (lastStderr.length) {
          var lastInfo = lastStderr
        } else {
          lastInfo = lastStdout
        }

        err.details = lastInfo.join('')
        return cb(err)
      }

      return cb(null, lastStdout.join(''))
    })
  }

  _toEnvFormat (obj, prefix) {
    if (!(typeof obj !== 'undefined' && obj !== null)) {
      return {}
    }

    var delimiter = '__'

    var flat = flatten(obj, {delimiter: delimiter})

    var environment = {}
    for (var key in flat) {
      var val = flat[key]
      var parts = []
      parts.push('FREY')

      if ((typeof prefix !== 'undefined' && prefix !== null)) {
        parts.push(inflection.underscore(prefix).toUpperCase())
      }

      parts.push(inflection.underscore(key).toUpperCase())

      var envKey = parts.join(delimiter)
      envKey = envKey.replace('.', '_')
      environment[envKey] = val
    }

    return environment
  }
}

module.exports = Command
