'use strict'
import Command from '../Command'
import mkdirp from 'mkdirp'
import utils from '../Utils'
import semver from 'semver'
import fs from 'fs'
import async from 'async'
import depurar from 'depurar'; const debug = depurar('frey')

class Prepare extends Command {
  constructor (name, runtime) {
    super(name, runtime)
    this.dir = this.runtime.init.cliargs.projectDir
  }

  main (cargo, cb) {
    return async.eachSeries(this.runtime.deps, this._make.bind(this), (err) => {
      if (err) {
        return cb(err)
      }

      cb(null, { })
    })
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

      fs.stat(props.privkeyEnc, (err) => {
        if (!err) {
          // We have an encrypted version, let's try a reconstruct
          if (!process.env.FREY_ENCRYPTION_SECRET) {
            debug(`Wanted to reconstruct '${props.privkey}' from '${props.privkeyEnc}' but there is no FREY_ENCRYPTION_SECRET`)
          } else {
            process.on('exit', (code) => {
              // From node docs: "You must only perform synchronous operations in this handler"
              try {
                this._out(`Cleaning up '${props.privkey}' after process exit with code '${code}' \n`)
                fs.unlinkSync(props.privkey)
              } catch (e) {
                this._out(`Was unable to clean up '${props.privkey}'\n`)
              }
            })

            this._out(`Reconstructing private key '${props.privkey}' from '${props.privkeyEnc}'\n`)
            return utils.decryptFile(props.privkeyEnc, props.privkey, process.env.FREY_ENCRYPTION_SECRET, (err) => {
              if (err) {
                return cb(err)
              }
              const cmd = [
                `(grep 'BEGIN RSA PRIVATE KEY' '${props.privkey}' || (rm -f '${props.privkey}'; false))`,
                `chmod 400 '${props.privkey}'`
              ].join(' && ')
              this.shell._exeScript(cmd, {verbose: true, limitSamples: false}, cb)
            })
          }
        }

        this._out(`Creating private key '${props.privkey}'\n`)
        const cmd = [
          `ssh-keygen -b 2048 -t rsa -C '${props.email}' -f '${props.privkey}' -q -N ''`,
          `rm -f '${props.privkey}.pub'`
        ].join(' && ')
        this.shell._exeScript(cmd, {verbose: true, limitSamples: false}, cb)
      })
    })
  }

  _makePrivkeyEnc (props, cb) {
    if (!process.env.FREY_ENCRYPTION_SECRET) {
      // Not needed
      debug(`Skipping creation of '${props.privkeyEnc}', as there is no FREY_ENCRYPTION_SECRET`)
      return cb(null)
    }
    return fs.stat(props.privkeyEnc, (err) => {
      if (!err) {
        // Already exists
        debug(`Key '${props.privkeyEnc}' aready exists`)
        return cb(null)
      }

      this._out(`Creating private encrypted key '${props.privkeyEnc}'\n`)
      utils.encryptFile(props.privkey, props.privkeyEnc, process.env.FREY_ENCRYPTION_SECRET, (err) => {
        if (err) {
          return cb(err)
        }

        const cmd = [
          `chmod 400 '${props.privkeyEnc}'`
        ].join(' && ')
        this.shell._exeScript(cmd, {verbose: true, limitSamples: false}, cb)
      })
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

      this.shell._exeScript(cmd, {verbose: true, limitSamples: false, stdin: 0}, cb)
    })
  }

  _makePubkeyFingerprint (props, cb) {
    const cmd = `ssh-keygen -lf '${props.pubkey}' | awk '{print $2}'`
    this.shell._exeScript(cmd, {verbose: false, limitSamples: false}, (err, stdout) => {
      this.runtime.config.global.ssh.keypub_fingerprint = `${stdout}`.trim()
      return cb(err)
    })
  }

  _makePermission (props, cb) {
    debug(`perming ${props.file} ${props.mode}`)
    return fs.chmod(props.file, props.mode, cb)
  }

  _makeDir (props, cb) {
    return mkdirp(props.dir, (err) => {
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

      return this.shell.confirm(`May I run '${props.cmdInstall}' for you?`, (err) => {
        if (err) {
          return cb(err)
        }

        this.shell._exeScript(props.cmdInstall, {}, (err, stdout) => {
          if (err) {
            return cb(new Error(`Failed to install '${props.name}'. ${err}`))
          }

          return this._satisfy(props, (satisfied) => {
            if (!satisfied) {
              const msg = `Version of '${props.name}' still not satisfied after install`
              return cb(new Error(msg))
            }

            return cb(null)
          })
        })
      })
    })
  }

  _satisfy (appProps, cb) {
    this.shell._exeScript(appProps.cmdVersion, {verbose: false, limitSamples: false}, (err, stdout) => {
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
