'use strict'
import chalk from 'chalk'
import util from 'util'
import async from 'async'
import _ from 'lodash'
import depurar from 'depurar'
const debug = depurar('frey')

class Base {
  constructor () {
    this.boot = []
    this.bootCargo = {}
  }

  main (bootOptions, cb) {
    return debug('You should override this with main class logic. ')
  }

  /**
   * Runs a methods found in this.boot similar to async.waterfall,
   * but stores each result in this.bootCargo[method] so it's accessible
   * not just by the next method, but methods after that too.
   *
   * After all the methods in this.boot are called, it finally coveralls
   * this.main
   *
   * @param {cb} function when done
   */
  run (cb) {
    // Create an array of wrapper methods that can store results
    // in bootCargo, before executing the callback
    const methods = []
    this.boot.forEach(method => {
      return methods.push((cargo, cb) => {
        const f = this[method].bind(this)
        return f(cargo, (err, cargo) => {
          this.bootCargo[method] = cargo
          return cb(err, cargo)
        })
      })
    })

    // Prefix a fake method so all methods can have the same signature
    methods.unshift(async.constant({}))

    // Run the wrappers
    return async.waterfall(methods, (err, bootOptions) => {
      if (err) {
        return cb(err)
      }

      this.main(bootOptions, cb)
    })
  }

  _secureOutput (input) {
    let result = _.clone(input)

    if (_.isObject(result)) {
      _.forOwn(result, (val, key) => {
        result[key] = this._secureOutput(val)
      })
    } else if (_.isArray(result)) {
      result.forEach((val, i) => {
        result[i] = this._secureOutput(val)
      })
    } else if (_.isString(result)) {
      _.forOwn(process.env, (val, key) => {
        if (key.indexOf('SECRET') > -1 || key.indexOf('PASSWORD') > -1 || key.indexOf('TOKEN') > -1) {
          result = _.replace(result, val, '********')
        }
      })
    }

    return result
  }

  _out (...args) {
    let index = 0
    let str = args[0]
    str = `${str}`.replace(/%[o%s]/g, m => {
      if (m === '%%') {
        return m
      }

      index++
      let ret = (_.pullAt(args, index))[0]
      ret = util.inspect(ret, {colors: chalk.supportsColor})

      if (m === '%o') {
        ret = ret.replace(/\s*\n\s*/g, ' ')
      }

      return ret
    })

    str = this._secureOutput(str)

    return process.stdout.write(`${str}`)
  }
}

module.exports = Base
