'use strict'
import Command from '../Command'
import mkdirp from 'mkdirp'
import semver from 'semver'
import fs from 'fs'
import async from 'async'
import depurar from 'depurar'; const debug = depurar('frey')

class Prepare extends Command {
  constructor (name, options, runtime) {
    super(name, options, runtime)
    this.dir = this.options.recipeDir
  }

  main (cargo, cb) {
    return async.eachSeries(this.runtime.deps, this._make.bind(this), cb)
  }

  _make (props, cb) {
    let func = this[`_make${props.type}`]
    if (!func) {
      return cb(new Error(`Unsupported dependency type: '${props.type}'`))
    }

    func = func.bind(this)
    return func(props, cb)
  }

  _makePrivkey (props, cb) {
    return fs.stat(props.privkey, (err) => {
      if (!err) {
        // Already exists
        debug(`Key '${props.privkey}' aready exists`)
        return cb(null)
      }

      this._out(`Creating private key '${props.privkey}'\n`)
      const cmd = [
        `ssh-keygen -b 2048 -t rsa -C '${props.email}' -f '${props.privkey}' -q -N ''`,
        `rm -f '${props.privkey}.pub'`
      ].join(' && ')
      return this._exeScript(cmd, {verbose: true, limitSamples: false}, cb)
    })
  }

  _makePubkey (props, cb) {
    return fs.stat(props.pubkey, (err) => {
      if (!err) {
        // Already exists
        debug(`Key '${props.pubkey}' aready exists`)
        return cb(null)
      }

      this._out(`Creating public key '${props.pubkey}'\n`)
      const cmd = [
        `echo -n $(ssh-keygen -yf '${props.privkey}') > '${props.pubkey}'`,
        `echo ' ${props.email}' >> '${props.pubkey}'`
      ].join(' && ')

      return this._exeScript(cmd, {verbose: true, limitSamples: false, stdin: 0}, cb)
    })
  }

  _makePubkeyFingerprint (props, cb) {
    const cmd = `ssh-keygen -lf '${props.pubkey}' | awk '{print $2}'`
    return this._exeScript(cmd, {verbose: false, limitSamples: false}, (err, stdout) => {
      this.runtime.ssh.keypub_fingerprint = `${stdout}`.trim()
      return cb(err)
    })
  }

  _makePermission (props, cb) {
    debug(`perming ${props.file} ${props.mode}`)
    return fs.chmod(props.file, props.mode, cb)
  }

  _makeDir (props, cb) {
    return mkdirp(props.dir, err => {
      if (err) {
        return cb(err)
      }

      debug(`Directory for '${props.name}' present at '${props.dir}'`)
      return cb(null)
    })
  }

  _makeApp (props, cb) {
    return this._satisfy(props, (satisfied) => {
      if (satisfied) {
        return cb(null)
      }

      return this._cmdYesNo(props.cmdInstall, (err) => {
        if (err) {
          return cb(new Error(`Failed to install '${props.name}'. ${err}`))
        }

        return this._satisfy(props, satisfied => {
          if (!satisfied) {
            const msg = `Version of '${props.name}' still not satisfied after install`
            return cb(new Error(msg))
          }

          return cb(null)
        })
      })
    })
  }

  _satisfy (appProps, cb) {
    this._exeScript(appProps.cmdVersion, {verbose: false, limitSamples: false}, (err, stdout) => {
      if (err) {
        // We don't want to bail out if version command does not exist yet
        // Or maybe --version returns non-zero exit code, which is common
        debug({
          msg: `Continuing after failed command ${appProps.cmd}. ${err}`,
          exe: appProps.exe,
          foundVersion: foundVersion,
          err: err,
          stdout: stdout
        })
      }

      const foundVersion = appProps.versionTransformer(stdout)

      this._out(`Found '${appProps.name}' with version '${foundVersion}'\n`)

      if (!stdout || !semver.satisfies(foundVersion, appProps.range)) {
        this._out(`'${appProps.name}' needs to be installed or upgraded. \n`)
        return cb(false)
      }

      return cb(true)
    })
  }
}

module.exports = Prepare
