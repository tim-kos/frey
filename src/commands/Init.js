'use strict'
import Command from '../Command'

class Init extends Command {
  constructor (name, options, runtime) {
    super(name, options, runtime)
    this.boot = [
      '_paths',
      '_options',
      '_os'
    ]
  }

  _paths (cargo, cb) {
    return cb(null, {
      ansibleCfg: this.options.recipeDir + '/Frey-residu-ansible.cfg',
      planFile: this.options.recipeDir + '/Frey-residu-terraform.plan',
      infraFile: this.options.recipeDir + '/Frey-residu-infra.tf.json',
      playbookFile: this.options.recipeDir + '/Frey-residu-install.yml',
      stateFile: this.options.recipeDir + '/Frey-state-terraform.tfstate'
    })
  }

  _options (cargo, cb) {
    return cb(null)
  }

  _os (cargo, cb) {
    return cb(null)
  }

  main (cargo, cb) {
    return cb(null, this.bootCargo)
  }
}

module.exports = Init
