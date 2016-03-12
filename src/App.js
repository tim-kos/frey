'use strict'
import _ from 'lodash'
import Shell from './Shell'
import depurar from 'depurar'; const debug = depurar('frey')

class App {
  constructor (opts) {
    this.opts = opts
    this.runtime = opts.runtime
    this.shell = new Shell(this.runtime)
  }

  _exe (defaults, cb) {
    const exe = this.opts.exe || defaults.exe
    const signatureOpts = this.opts.signatureOpts || defaults.signatureOpts
    const cmdOpts = this.opts.cmdOpts || defaults.cmdOpts
    const env = this._objectToEnv(_.defaults(this.opts.env, defaults.env))
    const args = this._objectToFlags(_.defaults(this.opts.args, defaults.args), signatureOpts)

    const cmdArgs = [ exe ].concat(args)
    debug({cmdArgs: cmdArgs, env: env})
    this.shell._exe(cmdArgs, { env: env, cmdOpts: cmdOpts }, (err, stdout) => {
      if (err) {
        return cb(err)
      }

      return cb(null, stdout)
    })
  }

  _escape (str) {
    if (!str.replace) {
      throw new Error('You should pass _escape a string. But you passed: ' + str)
    }
    return str.replace(/([^a-zA-Z0-9\-\.\/\,\_])/g, '\\$1')
  }

  _objectToEnv (obj, opts = {}) {
    // Unset all that was turned off via null
    _.forOwn(obj, (val, key) => {
      if (val === null) {
        delete obj[key]
      }
    })

    return obj
  }

  _objectToFlags (obj, opts = {}) {
    // Unset all that was turned off via null
    _.forOwn(obj, (val, key) => {
      if (val === null) {
        delete obj[key]
      }
    })

    opts.equal = opts.equal || ''
    opts.quote = opts.quote || ''
    opts.dash = opts.dash || ''
    opts.escape = opts.escape === true || opts.escape === undefined

    let fn = (str) => {
      return str
    }
    if (opts.escape) {
      fn = this._escape
    }

    const args = []
    _.forOwn(obj, (val, key) => {
      if (val === true) {
        // as is
        args.push(fn(key))
      } else if (val === null) {
        // turned off, skip
        return
      } else {
        // key/value pair
        args.push([
          opts.dash,
          fn(key),
          opts.equal,
          opts.quote,
          fn(val),
          opts.quote
        ].join(''))
      }
    })

    return args
  }
}

module.exports = App
