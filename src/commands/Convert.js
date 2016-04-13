'use strict'
import Command from '../Command'
import constants from '../constants'
import path from 'path'
import async from 'async'
import globby from 'globby'
import depurar from 'depurar'; const debug = depurar('frey')
import Hcltool020 from '../Hcltool020'
import Hcltool0115 from '../Hcltool0115'
import fs from 'fs'
import _ from 'lodash'
import tomlify from 'tomlify-j0.4'
import INI from 'ini'
import YAML from 'js-yaml'

class Convert extends Command {
  constructor (name, runtime) {
    super(name, runtime)
    this.boot = [
      '_confirm'
    ]
  }

  _confirm (cargo, cb) {
    this.shell.confirm('About to convert existing YAML, CFG and TF to TOML files in your project dir. Make sure your files are under source control as this is a best-effort procedure. May I proceed?', cb)
  }

  _parseYamlFile (yamlFile, cb) {
    const parsed = YAML.safeLoad(fs.readFileSync(yamlFile, 'utf8'))
    cb(null, { install: { playbooks: parsed } })
  }

  _parseIniFile (iniFile, cb) {
    const parsed = INI.parse(fs.readFileSync(iniFile, 'utf8'))
    cb(null, { global: { ansiblecfg: parsed } })
  }

  _parseHcl020 (tfFile, cb) {
    const opts = {
      args: {},
      runtime: this.runtime
    }

    opts.args[tfFile] = constants.SHELLARG_APPEND_AS_IS
    const hclTool = new Hcltool020(opts)

    hclTool.exe((err, stdout) => {
      if (err) {
        return cb(err)
      }

      return cb(null, JSON.parse(stdout))
    })
  }

  _parseHcl0115 (tfFile, cb) {
    const opts = {
      args: {},
      runtime: this.runtime
    }

    opts.args[tfFile] = constants.SHELLARG_APPEND_AS_IS
    const hclTool = new Hcltool0115(opts)

    hclTool.exe((err, stdout) => {
      if (err) {
        return cb(err)
      }

      return cb(null, JSON.parse(stdout))
    })
  }

  _parseTfFile (tfFile, cb) {
    // @todo We unfortunately have to run two versions of hcltool due to
    // different bugs hurting both 0.1.15 and 0.2.0
    // https://github.com/virtuald/pyhcl/issues/7
    // When that is resolved, let's just have 1 version
    this._parseHcl020(tfFile, (err, parsed) => {
      if (err) {
        this._parseHcl0115(tfFile, (err, parsed) => {
          if (err) {
            return cb(err)
          }
          return cb(null, { infra: parsed })
        })
      } else {
        return cb(null, { infra: parsed })
      }
    })
  }

  _parseFile (origFile, cb) {
    switch (path.extname(origFile)) {
      case '.yaml':
      case '.yml':
        this._parseYamlFile(origFile, cb)
        break
      case '.tf':
        this._parseTfFile(origFile, cb)
        break
      case '.cfg':
        this._parseIniFile(origFile, cb)
        break
      default:
        return cb(new Error('Unrecognized extension'))
    }
  }

  main (cargo, cb) {
    const pattern = `${this.runtime.init.cliargs.projectDir}/*.{yml,yaml,tf,cfg}`
    debug(`Reading from '${pattern}'`)

    return globby(pattern)
      .then((origFiles) => {
        async.map(origFiles, this._parseFile.bind(this), (err, mapped) => {
          if (err) {
            return cb(err)
          }

          let config = {}
          mapped.forEach((val) => {
            config = _.extend(config, val)
          })

          const toml = tomlify(config, null, 2)

          fs.writeFile(`${this.runtime.init.cliargs.projectDir}/Freyfile.toml`, toml, 'utf-8', cb)
        })
      })
      .catch(cb)
  }
}

module.exports = Convert
