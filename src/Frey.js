'use strict'
// var info = Depurar('frey')
// import util from 'util'
// import fs from 'fs'
// import depurar from 'depurar'; const debug = depurar('frey')
import inflection from 'inflection'
import async from 'async'
import os from 'os'
import _ from 'lodash'
import path from 'path'
import chalk from 'chalk'
import Base from './Base'
import utils from './Utils'
import osHomedir from 'os-homedir'
import commands from './commands'
import pkgConfig from '../package.json'

class Frey extends Base {
  constructor (cliargs) {
    super()
    this.boot = [
      '_injectOptions',
      '_defaults',
      '_normalize',
      '_composeChain'
    ]
    this.cliargs = cliargs
    this.runtime = {}
  }

  _injectOptions (cliargs, nextCb) {
    nextCb(null, _.clone(this.cliargs))
  }

  _defaults (cliargs = {}, nextCb) {
    if (cliargs._ === undefined) { cliargs._ = [] }
    if (cliargs._[0] === undefined) { cliargs._[0] = 'prepare' }
    if (cliargs.tmp === undefined) { cliargs.tmp = os.tmpdir() }
    if (cliargs.cwd === undefined) { cliargs.cwd = process.cwd() }
    if (cliargs.home === undefined) { cliargs.home = osHomedir() }
    if (cliargs.user === undefined) { cliargs.user = process.env.USER }
    if (cliargs.platform === undefined) { cliargs.platform = os.platform() }
    if (cliargs.hostname === undefined) { cliargs.hostname = os.hostname() }
    if (cliargs.arch === undefined) { cliargs.arch = `${os.arch()}`.replace('x64', 'amd64') }

    nextCb(null, cliargs)
  }

  _normalize (cliargs, nextCb) {
    // Render interdependent arguments
    cliargs = utils.render(cliargs, cliargs)

    // Apply simple functions. Not perfect, but let's start engineering when the
    // use-case arises:
    _.forOwn(cliargs, (val, key) => {
      if (`${val}`.match(/\|basename$/)) {
        val = val.replace(/\|basename$/, '')
        val = path.basename(val)
        cliargs[key] = val
      }
    })

    if (cliargs.tags === undefined) {
      cliargs.tags = ''
    }

    nextCb(null, cliargs)
  }

  _composeChain (cliargs, nextCb) {
    const cmd = cliargs._[0]
    const chain = _.filter(commands, { 'chained': true })
    const startAt = _.findIndex(chain, {name: cmd})

    if (startAt < 0) {
      // This command is not part of the chain
      cliargs.filteredChain = [ cmd ]
    } else {
      let length = 0
      if (cliargs.bail) {
        length = startAt + 1
      } else if (cliargs.bailAfter && _.findIndex(chain, {name: cliargs.bailAfter}) > -1) {
        length = _.findIndex(chain, {name: cliargs.bailAfter}) + 1
      } else {
        length = chain.length
      }

      const sliced = chain.slice(startAt, length)
      cliargs.filteredChain = _.map(sliced, 'name')
    }

    if (cliargs.filteredChain.indexOf('prepare') < 0 && (startAt < 0 || startAt > _.findIndex(chain, {name: 'prepare'}))) {
      cliargs.filteredChain.unshift('prepare')
    }

    if (cliargs.filteredChain.indexOf('compile') < 0 && (startAt < 0 || startAt > _.findIndex(chain, {name: 'compile'}))) {
      cliargs.filteredChain.unshift('compile')
    }

    cliargs.filteredChain.unshift('init')

    nextCb(null, cliargs)
  }

  main (bootOptions, cb) {
    this.cliargs = bootOptions

    this._out('--> Frey version %s\n', pkgConfig.version)
    this._out('--> Will run: %o\n', this.cliargs.filteredChain)

    async.eachSeries(this.cliargs.filteredChain, this._runOne.bind(this), cb)
  }

  _runOne (command, cb) {
    const className = inflection.classify(command)
    const p = `./commands/${className}`
    const Class = require(p)
    const obj = new Class(command, this.cliargs, this.runtime)
    const func = obj.run.bind(obj)

    this._out(chalk.gray('--> '))
    this._out(chalk.gray(`${os.hostname()} - `))
    this._out(chalk.green(`${command}`))
    this._out(chalk.green('\n'))

    func((err, result) => {
      const append = {}
      append[command] = result
      this.runtime = _.extend(this.runtime, append)
      return cb(err)
    })
  }
}

module.exports = Frey
