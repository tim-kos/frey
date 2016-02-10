'use strict'
// import Depurar from 'depurar'
// var debug = Depurar('frey')
// var info = Depurar('frey')
// import util from 'util'
// import fs from 'fs'
import inflection from 'inflection'
import async from 'async'
import os from 'os'
import _ from 'lodash'
import path from 'path'
import mkdirp from 'mkdirp'
import chalk from 'chalk'
import Base from './Base'
import utils from 'utils'
import osHomedir from 'os-homedir'
import commands from './commands'
import pkgConfig from '../package.json'

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

  _defaults (options = {}, nextCb) {
    if (!(options._ != null)) { options._ = [] }
    if (!(options._[0] != null)) { options._[0] = 'prepare' }
    if (!(options.tmp != null)) { options.tmp = os.tmpdir() }
    if (!(options.home != null)) { options.home = osHomedir() }
    if (!(options.user != null)) { options.user = process.env.USER }

    return nextCb(null, options)
  }

  _normalize (options, nextCb) {
    // Render interdependent arguments
    for (let k1 in options) {
      let val = options[k1]
      if (val === `${val}`) {
        options[k1] = utils.render(val, options)
      }
    }

    // Apply simple functions
    for (let k2 in options) {
      let val = options[k2]
      if (`${val}`.match(/\|basename$/)) {
        val = val.replace(/\|basename$/, '')
        val = path.basename(val)
        options[k2] = val
      }
    }

    // Resolve to absolute paths
    const iterable = [ 'sshkeysDir', 'recipeDir', 'toolsDir' ]
    for (let i = 0, k3; i < iterable.length; i++) {
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
    ], err => {
      return nextCb(err, options)
    })
  }

  _composeChain (options, nextCb) {
    const cmd = options._[0]
    const chain = _.filter(commands, { 'chained': true })
    const indexStart = _.findIndex(chain, {name: cmd})

    if (indexStart < 0) {
      // This command is not part of the chain
      options.filteredChain = [ cmd ]
    } else {
      let length = 0
      if (options.bail) {
        length = indexStart + 1
      } else if (options.bailAfter && _.findIndex(chain, {name: options.bailAfter}) > -1) {
        length = _.findIndex(chain, {name: options.bailAfter}) + 1
      } else {
        length = chain.length
      }

      const sliced = chain.slice(indexStart, length)
      options.filteredChain = _.map(sliced, 'name')
    }

    if (options.filteredChain.indexOf('prepare') < 0) {
      options.filteredChain.unshift('prepare')
    }

    options.filteredChain.unshift('runtime')

    return nextCb(null, options)
  }

  main (bootOptions, cb) {
    this.options = bootOptions

    this._out('--> Frey version %s\n', pkgConfig.version)
    this._out('--> Will run: %o\n', this.options.filteredChain)

    return async.eachSeries(this.options.filteredChain, this._runOne.bind(this), cb)
  }

  _runOne (command, cb) {
    const className = inflection.classify(command)
    const p = `./commands/${className}`
    const Class = require(p)
    const obj = new Class(command, this.options, this.runtime)
    const func = obj.run.bind(obj)

    this._out(chalk.gray('--> '))
    this._out(chalk.gray(`${os.hostname()} - `))
    this._out(chalk.green(`${command}`))
    this._out(chalk.green('\n'))

    return func((err, result) => {
      const append = {}
      append[command] = result
      this.runtime = _.extend(this.runtime, append)
      return cb(err)
    })
  }
}

module.exports = Frey
