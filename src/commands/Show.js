'use strict'
import Command from '../Command'
import fs from 'fs'
import globby from 'globby'
import Terraform from '../Terraform'
import Ansible from '../Ansible'
import _ from 'lodash'
import uuid from 'node-uuid'
import mkdirp from 'mkdirp'
import depurar from 'depurar'; const debug = depurar('frey')

class Show extends Command {
  constructor (name, runtime) {
    super(name, runtime)
    this.boot = [
      '_createTmpDir',
      'output',
      'all_public_addresses',
      'facts'
    ]
    this.tmpDir = this.runtime.init.os.tmp + '/' + uuid.v4()
  }

  _createTmpDir (cargo, cb) {
    mkdirp(this.tmpDir, cb)
  }

  output (cargo, cb) {
    if (!_.has(this.runtime.config, 'infra')) {
      debug(`Skipping output as there are no infra instructions`)
      return cb(null)
    }

    const terraform = new Terraform({
      cmdOpts: { verbose: false },
      args: {
        output: undefined,
        state: this.runtime.config.global.infra_state_file,
        parallelism: null
      },
      runtime: this.runtime
    })

    terraform.exe(cb)
  }

  all_public_addresses (cargo, cb) {
    if (!_.has(this.runtime.config, 'infra')) {
      debug(`Skipping all_public_addresses as there are no infra instructions`)
      return cb(null)
    }

    const terraform = new Terraform({
      cmdOpts: { verbose: false },
      args: {
        output: undefined,
        state: this.runtime.config.global.infra_state_file,
        parallelism: null,
        public_addresses: undefined
      },
      runtime: this.runtime
    })

    terraform.exe(cb)
  }

  facts (cargo, cb) {
    if (!_.has(this.runtime.config, 'install.playbooks')) {
      debug(`Skipping facts as there are no install instructions`)
      return cb(null)
    }

    const ansibleProps = _.find(this.runtime.prepare.deps, { name: 'ansible' })
    const opts = { exe: ansibleProps.exe, args: {}, runtime: this.runtime, cmdOpts: { verbose: false } }

    opts.args['module-name'] = 'setup'
    opts.args['tree'] = this.tmpDir
    opts.args['all'] = undefined

    const ansible = new Ansible(opts)
    ansible.exe((err, stdout) => {
      if (err) {
        return cb(err)
      }

      let out = ''
      globby.sync(`${this.tmpDir}/*`).forEach((filepath) => {
        const facts = JSON.parse(fs.readFileSync(filepath, 'utf-8'))

        out += _.get(facts, 'ansible_facts.ansible_fqdn')
        out += ','
        out += 'ansible_facts.ansible_service_mgr = ' + _.get(facts, 'ansible_facts.ansible_service_mgr')
        out += '\n'
      })

      cb(null, out)
    })
  }

  main (cargo, cb) {
    const results = {
      output: this.bootCargo.output,
      all_public_addresses: this.bootCargo.all_public_addresses,
      facts: this.bootCargo.facts
    }

    _.forOwn(results, (out, key) => {
      if (out) {
        this._out(`- [ ${key} ] -------------------------------- \n`)
        this._out(`${out} \n`)
      }
    })

    cb(null, results)
  }
}

module.exports = Show
