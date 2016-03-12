'use strict'
import Command from '../Command'
import fs from 'fs'
import globby from 'globby'
import Terraform from '../Terraform'
import Ansible from '../Ansible'
import _ from 'lodash'
import depurar from 'depurar'; const debug = depurar('frey')

class Show extends Command {
  constructor (name, runtime) {
    super(name, runtime)
    this.boot = [
      '_gatherHost',
      'facts',
      'output'
    ]
  }

  _gatherHost (cargo, cb) {
    // @todo Ansible wants uppy-server here - not ec2.-etc
    // const terraform = new Terraform({
    //   args: {
    //     output: undefined,
    //     state: this.runtime.config.global.infra_state_file,
    //     parallelism: null,
    //     public_address: undefined
    //   },
    //   runtime: this.runtime
    // })
    //
    // terraform.exe((err, stdout) => {
    //   if (err) {
    //     return cb(err)
    //   }
    //
    //   const host = `${stdout}`.split('\n')[0].trim()
    //   return cb(null, host)
    // })
    //

    debug(this.runtime.config.install)
    cb(null, _.get(this.runtime, 'config.install.playbooks.0.hosts'))
  }

  facts (cargo, cb) {
    const ansibleProps = _.find(this.runtime.prepare.deps, { name: 'ansible' })
    const opts = { exe: ansibleProps.exe, args: {}, runtime: this.runtime }

    opts.args['module-name'] = 'setup'
    opts.args['tree'] = '/tmp/frey-facts'
    opts.args[this.bootCargo._gatherHost] = undefined

    const ansible = new Ansible(opts)
    ansible.exe((err, stdout) => {
      if (err) {
        return cb(err)
      }

      const facts = JSON.parse(fs.readFileSync(globby.sync('/tmp/frey-facts/*')[0], 'utf-8'))

      let out = ''
      out += 'ansible_facts.ansible_service_mgr = ' + _.get(facts, 'ansible_facts.ansible_service_mgr') + '\n'

      cb(null, out)
    })
  }

  output (cargo, cb) {
    const terraform = new Terraform({
      args: {
        output: undefined,
        state: this.runtime.config.global.infra_state_file,
        parallelism: null
      },
      runtime: this.runtime
    })

    terraform.exe(cb)
  }

  main (cargo, cb) {
    const results = {
      output: this.bootCargo.output,
      facts: this.bootCargo.facts
    }

    _.forOwn(results, (out) => {
      this._out(`${out} \n`)
    })

    cb(null, results)
  }
}

module.exports = Show
