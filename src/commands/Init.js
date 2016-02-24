'use strict'
import Command from '../Command'
import utils from '../Utils'
import osHomedir from 'os-homedir'
import os from 'os'
import path from 'path'
import _ from 'lodash'

class Init extends Command {
  constructor (name, runtime) {
    super(name, runtime)
    this.boot = [
      '_env',
      '_os',
      '_cliargs',
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
    let cliargs = this.runtime.frey.cliargs

    // Defaults
    if (cliargs.tags === undefined) {
      cliargs.tags = ''
    }

    if (cliargs.projectdir === undefined) {
      cliargs.projectdir = this.bootCargo._os.cwd
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
    cliargs.projectdir = path.resolve(cliargs.projectdir)

    return cb(null, cliargs)
  }

  _paths (cargo, cb) {
    return cb(null, {
      ansibleSettingsFile: this.bootCargo._cliargs.projectdir + '/Frey-residu-ansible.cfg',
      planFile: this.bootCargo._cliargs.projectdir + '/Frey-residu-terraform.plan',
      infraFile: this.bootCargo._cliargs.projectdir + '/Frey-residu-infra.tf.json',
      playbookFile: this.bootCargo._cliargs.projectdir + '/Frey-residu-install.yml',
      stateFile: this.bootCargo._cliargs.projectdir + '/Frey-state-terraform.tfstate'
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
