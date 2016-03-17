'use strict'
import Command from '../Command'
import _ from 'lodash'
import fs from 'fs'
import depurar from 'depurar'; const debug = depurar('frey')
import flatten from 'flat'
import YAML from 'js-yaml'
import commands from '../commands'

class Docbuild extends Command {
  constructor (name, runtime) {
    super(name, runtime)
    this.boot = [
      '_chain',
      '_defaults'
    ]
  }

  _chain (cargo, cb) {
    const chainYaml = this.runtime.init.paths.frey_dir + '/chain.yml'
    fs.writeFileSync(chainYaml, YAML.safeDump(commands), 'utf-8')
    debug('Wrote ' + chainYaml)
    cb(null)
  }

  _defaults (cargo, cb) {
    const defaultYaml = this.runtime.init.paths.frey_dir + '/defaults.yml'
    const runtime = _.cloneDeep(this.runtime)

    delete runtime.frey
    runtime.init.env = 'Hold all environment variables Frey was run with. The ones starting with FREY_ are automatically made available to Terraform as variables. '
    runtime.prepare = 'Hold values that Frey used internally to set up dependencies. Refrain from using these'
    runtime.config.infra = 'Hold values that you defined yourself in the Freyfile'
    runtime.config.install = 'Hold values that you defined yourself in the Freyfile'
    runtime.config.setup = 'Hold values that you defined yourself in the Freyfile'
    runtime.config.deploy = 'Hold values that you defined yourself in the Freyfile'
    runtime.config.restart = 'Hold values that you defined yourself in the Freyfile'

    const flattened = flatten(runtime, { delimiter: '.' })
    const output = {}

    _.forOwn(flattened, (val, key) => {
      if (val === undefined) {
        delete flattened[key]
        return
      }
      if (typeof val === 'function') {
        delete flattened[key]
        return
      }
      if (_.isNumber(val)) {
        output[key] = 'Example: ' + val
        return
      }
      if (!_.isString(val)) {
        output[key] = ''
        return
      }

      val = _.replace(val, this.runtime.init.cliargs.projectDir, '{{{ cliargs.projectDir }}}')
      val = _.replace(val, this.runtime.init.os.home, '{{{ init.os.home }}}')
      val = _.replace(val, this.runtime.init.os.user, '{{{ init.os.user }}}')
      val = _.replace(val, this.runtime.init.paths.frey_dir, '{{{ init.paths.frey_dir }}}')

      output[key] = 'Example: ' + val
    })

    const buf = fs.readFileSync(defaultYaml, 'utf-8')
    const original = YAML.safeLoad(buf)
    // const original = {}
    const merged = _.defaults(original, output)
    fs.writeFileSync(defaultYaml, YAML.safeDump(merged), 'utf-8')
    debug('Wrote ' + defaultYaml)
    cb(null)
  }

  main (cargo, cb) {
    return cb(null)
  }
}

module.exports = Docbuild
