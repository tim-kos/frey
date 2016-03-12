'use strict'
import Command from '../Command'
import Shell from '../Shell'
// import Ansible from '../Ansible'
// import depurar from 'depurar'; const debug = depurar('frey')

class Show extends Command {
  constructor (name, runtime) {
    super(name, runtime)
    this.shell = new Shell(runtime)
    this.boot = [
    ]
  }

  main (cargo, cb) {
    // const ansible = new Ansible()
    // ansible.run()
    //
    // env \
    // PYTHONPATH=/Users/kvz/.frey/tools/ansible/2.0.0.2/pip/lib/python2.7/site-packages \
    // ANSIBLE_CONFIG=/Users/kvz/code/uppy-server/infra/Frey-residu-ansible.cfg \
    // TF_STATE=/Users/kvz/code/uppy-server/infra/Frey-state-terraform.tfstate \
    // /Users/kvz/.frey/tools/ansible/2.0.0.2/pip/bin/ansible -m setup uppy-server \
    // -vvvv \
    // --user=ubuntu \
    // --inventory-file=/Users/kvz/.frey/tools/terraform-inventory/0.6/terraform-inventory \
    // --private-key=/Users/kvz/code/uppy-server/infra/ssh/frey-infra.pem
  }
}

module.exports = Show
