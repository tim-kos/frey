'use strict'
const chalk = require('chalk')
const util = require('util')
const async = require('async')
const _ = require('lodash')
const debug = require('depurar')('frey')

class Base {
  constructor () {
    this.boot = []
    this.bootCargo = {}
  }

  main (bootOptions, cb) {
    return debug('You should override this with main class logic. ')
  }

  run (cb) {
    const methods = []
    const iterable = this.boot
    for (let i = 0, method; i < iterable.length; i++) {
      method = iterable[i];
      (method => {
        return methods.push((cargo, cb) => {
          const f = this[method].bind(this)
          return f(cargo, (err, cargo) => {
            this.bootCargo[method] = cargo
            return cb(err, cargo)
          })
        })
      })(method)
    }

    methods.unshift(async.constant({}))

    return async.waterfall(methods, (err, bootOptions) => {
      if (err) {
        return cb(err)
      }

      return this.main(bootOptions, cb)
    })
  }

  _out (...args) {
    let index = 0
    let str = args[0]
    str = `${str}`.replace(/%[o%s]/, m => {
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

    return process.stdout.write(`${str}`)
  }
}

module.exports = Base
