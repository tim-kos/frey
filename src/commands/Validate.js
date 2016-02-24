'use strict'
import Command from '../Command'
import async from 'async'
import fs from 'fs'

// import depurar from 'depurar'; const debug = depurar('frey')

class Validate extends Command {
  constructor (name, runtime) {
    super(name, runtime)
    this.boot = [
      '_findClosestProjectGit'
    ]
  }

  _findClosestProjectGit (cargo, cb) {
    return this._findClosestGit(this.runtime.init.cliargs.projectdir, filepath => {
      return cb(null, filepath)
    })
  }

  _findClosestGit (filepath, cb) {
    const parts = filepath.split('/')
    let paths = []
    let rem = ''

    for (let i = 0, part; i < parts.length; i++) {
      part = parts[i]
      if (!part) {
        continue
      }

      rem = `${rem}/${part}`
      paths.push(`${rem}/.git`)
    }

    // This operation is performed in parallel, but the results array will
    // be in the same order as the original. Hence, use the last/longest/closest
    // path that has Git.
    return async.reject(paths, fs.stat, results => {
      if (typeof results === 'undefined' || !results.length) {
        return cb(undefined)
      }

      return cb(results.pop())
    })
  }

  main (cargo, cb) {
    if (!this.bootCargo._findClosestProjectGit) {
      const msg = 'Frey requires project (and state) to be under Git, and residu to be ignored.'
      return cb(new Error(msg))
    }

    return cb(null)
  }
}

module.exports = Validate
