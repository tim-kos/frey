'use strict'
import Command from '../Command'
import utils from '../Utils'
import osHomedir from 'os-homedir'
import os from 'os'
import path from 'path'
import _ from 'lodash'
import async from 'async'
import fs from 'fs'
// import depurar from 'depurar'; const debug = depurar('frey')

class Init extends Command {
  constructor (name, runtime) {
    super(name, runtime)
    this.boot = [
      '_env',
      '_os',
      '_cliargs',
      '_findClosestProjectGit',
      '_paths'
    ]
  }

  _env (cargo, cb) {
    return cb(null, process.env)
  }

  _os (cargo, cb) {
    const osdata = {
      cores: os.cpus().length,
      tmp: os.tmpdir(),
      cwd: process.cwd(),
      home: osHomedir(),
      user: this.bootCargo._env.USER,
      platform: os.platform(),
      hostname: os.hostname(),
      arch: `${os.arch()}`.replace('x64', 'amd64')
    }
    return cb(null, osdata)
  }

  _cliargs (cargo, cb) {
    let cliargs = {}
    _.forOwn(this.runtime.frey.cliargs, (val, key) => {
      // Don't add dashed arguments, we only used the camelcased variants
      // to avoid confusion
      if (key.indexOf('-') < 0) {
        cliargs[key] = val
      }
    })

    // Defaults
    if (cliargs.tags === undefined) {
      cliargs.tags = ''
    }

    if (cliargs.projectDir === undefined) {
      cliargs.projectDir = this.bootCargo._os.cwd
    }

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

    // turn into absolute path
    cliargs.projectDir = path.resolve(cliargs.projectDir)

    return cb(null, cliargs)
  }

  _findClosestProjectGit (cargo, cb) {
    const parts = this.bootCargo._cliargs.projectDir.split('/')
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

    return async.reject(paths, fs.stat, (results) => {
      // debug({paths: paths, results: results})
      if (typeof results === 'undefined' || !results.length) {
        return cb(null, undefined)
      }

      return cb(null, results.pop())
    })
  }

  _paths (cargo, cb) {
    const freyDir = path.resolve(__dirname, '../..')
    return cb(null, {
      frey_dir: freyDir,
      roles_dir: freyDir + '/roles',
      git_dir: this.bootCargo._findClosestProjectGit
    })
  }

  main (cargo, cb) {
    return cb(null, {
      cliargs: this.bootCargo._cliargs,
      env: this.bootCargo._env,
      os: this.bootCargo._os,
      paths: this.bootCargo._paths
    })
  }
}

module.exports = Init
