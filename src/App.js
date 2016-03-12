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
    return str.replace(/([^a-zA-Z0-9\-\.\/])/g, '\\$1')
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

    const args = []
    _.forOwn(obj, (val, key) => {
      if (val === true) {
        // as is
        args.push(this._escape(key))
      } else if (val === null) {
        // turned off, skip
        return
      } else {
        // key/value pair
        args.push([
          opts.dash,
          this._escape(key),
          opts.equal,
          opts.quote,
          this._escape(val),
          opts.quote
        ].join(''))
      }
    })

    return args
  }
}

module.exports = App
