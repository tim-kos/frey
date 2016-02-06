'use strict'
// var Depurar = require('depurar')
// var debug = Depurar('frey')
// var info = Depurar('frey')
var inflection = require('inflection')
var async = require('async')
// var util = require('util')
var _ = require('lodash')
// var fs = require('fs')
var os = require('os')
var path = require('path')
var mkdirp = require('mkdirp')
var chalk = require('chalk')
var Base = require('./Base')
var Mustache = require('mustache')
var osHomedir = require('os-homedir')
// var commands = require('./commands')
var chain = require('./chain')

class Frey extends Base {
  constructor (options) {
    super()
    this.boot = [
      '_injectOptions',
      '_defaults',
      '_normalize',
      '_setup',
      '_composeChain'
    ]
    this.options = options
    this.runtime = {}
  }

  _injectOptions (options, nextCb) {
    return nextCb(null, _.clone(this.options))
  }

  _defaults (options, nextCb) {
    if (!(typeof options !== 'undefined' && options !== null)) { options = {} }
    if (!(options._ != null)) { options._ = [] }
    if (!(options._[0] != null)) { options._[0] = 'prepare' }
    if (!(options.tmp != null)) { options.tmp = os.tmpdir() }
    if (!(options.home != null)) { options.home = osHomedir() }
    if (!(options.user != null)) { options.user = process.env.USER }

    return nextCb(null, options)
  }

  _normalize (options, nextCb) {
    // Render interdependent arguments
    for (var k1 in options) {
      var val = options[k1]
      if (val === `${val}`) {
        options[k1] = Mustache.render(val, options)
        if (options[k1].indexOf('{{{') > -1) {
          return nextCb(new Error(`Unable to render vars in '${k1}' '${options[k1]}'`))
        }
      }
    }

    // Apply simple functions
    for (var k2 in options) {
      val = options[k2]
      if (`${val}`.match(/\|basename$/)) {
        val = val.replace(/\|basename$/, '')
        val = path.basename(val)
        options[k2] = val
      }
    }

    // Resolve to absolute paths
    var iterable = [ 'sshkeysDir', 'recipeDir', 'toolsDir' ]
    for (var i = 0, k3; i < iterable.length; i++) {
      k3 = iterable[i]
      if (!(options[k3] != null)) {
        throw new Error(`options.${k3} was found empty`)
      }

      options[k3] = path.resolve(options.recipeDir, options[k3])
    }

    if (!(options.tags != null)) {
      options.tags = ''
    }

    return nextCb(null, options)
  }

  _setup (options, nextCb) {
    return async.parallel([
      function (callback) {
        return mkdirp(options.toolsDir, callback)
      }
    ], function (err) {
      return nextCb(err, options)
    }
    )
  }

  _composeChain (options, nextCb) {
    var cmd = options._[0]
    var indexStart = chain.indexOf(cmd)

    if (indexStart < 0) {
      // This command is not part of the chain
      options.filteredChain = [ cmd ]
    } else {
      if (options.bail) {
        var length = indexStart + 1
      } else if (options.bailAfter && chain.indexOf(options.bailAfter) > -1) {
        length = chain.indexOf(options.bailAfter) + 1
      } else {
        length = chain.length
      }

      options.filteredChain = chain.slice(indexStart, length)
    }

    if (options.filteredChain.indexOf('prepare') < 0) {
      options.filteredChain.unshift('prepare')
    }

    options.filteredChain.unshift('runtime')

    return nextCb(null, options)
  }

  main (bootOptions, cb) {
    this.options = bootOptions

    if (this.options.verbose > 0) {
      this._out('--> Will run: %o\n', this.options.filteredChain)
    } else {
      this._out('--> Will run: %o\n', this.options.filteredChain)
    }

    return async.eachSeries(this.options.filteredChain, this._runOne.bind(this), cb)
  }

  _runOne (command, cb) {
    var className = inflection.classify(command)
    var p = `./commands/${className}`
    var Class = require(p)
    var obj = new Class(command, this.options, this.runtime)
    var func = obj.run.bind(obj)

    this._out(chalk.gray('--> '))
    this._out(chalk.gray(`${os.hostname()} - `))
    this._out(chalk.green(`${command}`))
    this._out(chalk.green('\n'))

    return func((err, result) => {
      var append = {}
      append[command] = result
      this.runtime = _.extend(this.runtime, append)
      return cb(err)
    })
  }
}

module.exports = Frey
