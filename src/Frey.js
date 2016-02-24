'use strict'
// var info = Depurar('frey')
// import util from 'util'
// import fs from 'fs'
// import depurar from 'depurar'; const debug = depurar('frey')
import inflection from 'inflection'
import async from 'async'
import _ from 'lodash'
import chalk from 'chalk'
import os from 'os'
import Base from './Base'
import commands from './commands'
import pkgConfig from '../package.json'

class Frey extends Base {
  constructor (cliargs = {}) {
    super()

    if (cliargs._ === undefined) { cliargs._ = [] }
    if (cliargs._[0] === undefined) { cliargs._[0] = 'prepare' }

    this.boot = [
      '_injectCliargs',
      '_composeChain'
    ]
    this.runtime = {
      frey: {
        cliargs: cliargs
      }
    }
  }

  _injectCliargs (cargo, nextCb) {
    nextCb(null, _.clone(this.runtime.frey.cliargs))
  }

  _composeChain (cliargs, nextCb) {
    const cmd = cliargs._[0]
    const chain = _.filter(commands, { 'chained': true })
    const startAt = _.findIndex(chain, {name: cmd})
    let filteredChain = []

    if (startAt < 0) {
      // This command is not part of the chain
      filteredChain = [ cmd ]
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
      filteredChain = _.map(sliced, 'name')
    }

    if (filteredChain.indexOf('prepare') < 0 && (startAt < 0 || startAt > _.findIndex(chain, {name: 'prepare'}))) {
      filteredChain.unshift('prepare')
    }

    if (filteredChain.indexOf('compile') < 0 && (startAt < 0 || startAt > _.findIndex(chain, {name: 'compile'}))) {
      filteredChain.unshift('compile')
    }

    filteredChain.unshift('init')

    nextCb(null, filteredChain)
  }

  main (cargo, cb) {
    this._out('--> Frey version %s\n', pkgConfig.version)
    this._out('--> Will run: %o\n', this.bootCargo._composeChain)

    async.eachSeries(this.bootCargo._composeChain, this._runOne.bind(this), cb)
  }

  _runOne (command, cb) {
    const className = inflection.classify(command)
    const p = `./commands/${className}`
    const Class = require(p)
    const obj = new Class(command, this.runtime)
    const func = obj.run.bind(obj)

    let hostname = _.get(this.runtime, 'init.os.hostname') || os.hostname()

    this._out(chalk.gray('--> '))
    this._out(chalk.gray(`${hostname} - `))
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
