'use strict'
import Command from '../Command'
import utils from '../Utils'
import os from 'os'
import depurar from 'depurar'; const debug = depurar('frey')

class Runtime extends Command {
  main (bootOptions, cb) {
    this.runtime.paths = {
      ansibleCfg: `{{{options__recipeDir}}}/Frey-residu-ansible.cfg`,
      planFile: `{{{options__recipeDir}}}/Frey-residu-terraform.plan`,
      infraFile: `{{{options__recipeDir}}}/Frey-residu-infra.tf.json`,
      playbookFile: `{{{options__recipeDir}}}/Frey-residu-install.yml`,
      stateFile: `{{{options__recipeDir}}}/Frey-state-terraform.tfstate`
    }

    this.runtime.ssh = {
      email: `{{{options__user}}}@{{{options__app}}}.freyproject.io`,
      keypair_name: `{{{options__app}}}`,
      keyprv_file: `{{{options__sshkeysDir}}}/frey-{{{options__app}}}.pem`,
      keypub_file: `{{{options__sshkeysDir}}}/frey-{{{options__app}}}.pub`,
      user: 'ubuntu'
    }

    this.runtime.deps = []

    this.runtime.deps.push({
      type: 'Dir',
      name: 'toolsDir',
      dir: `{{{options__toolsDir}}}`
    })

    this.runtime.deps.push({
      type: 'Dir',
      name: 'recipeDir',
      dir: `{{{options__recipeDir}}}`
    })

    this.runtime.deps.push({
      type: 'Dir',
      name: 'sshkeysDir',
      dir: `{{{options__sshkeysDir}}}`
    })

    this.runtime.deps.push({
      type: 'Privkey',
      privkey: `${this.runtime.ssh.keyprv_file}`,
      pubkey: `${this.runtime.ssh.keypub_file}`,
      email: `${this.runtime.ssh.email}`
    })

    this.runtime.deps.push({
      type: 'Pubkey',
      privkey: `${this.runtime.ssh.keyprv_file}`,
      pubkey: `${this.runtime.ssh.keypub_file}`,
      email: `${this.runtime.ssh.email}`
    })

    this.runtime.deps.push({
      type: 'Privkey',
      privkey: `${this.runtime.ssh.keyprv_file}`,
      pubkey: `${this.runtime.ssh.keypub_file}`
    })

    this.runtime.deps.push({
      type: 'Permission',
      mode: 0o400,
      file: `${this.runtime.ssh.keypub_file}`
    })

    this.runtime.deps.push({
      type: 'Permission',
      mode: 0o400,
      file: `${this.runtime.ssh.keyprv_file}`
    })

    this.runtime.deps.push({
      type: 'App',
      name: 'terraform',
      version: '0.6.11',
      range: `{{{self__version}}}`,
      dir: `{{{options__toolsDir}}}/terraform/{{{self__version}}}`,
      exe: `{{{self__dir}}}/terraform`,
      zip:
        `terraform` + `_` +
        `{{{self__version}}}` + `_` +
        '{{{os__platform}}}' + `_` +
        `{{{os__arch}}}.zip`,
      cmdVersion: '{{{self__exe}}} --version',
      versionTransformer (stdout) {
        const version = `${stdout}`.trim().split('\n')[0].split(/\s+/).pop().replace('v', '')
        return version
      },
      cmdInstall:
        `mkdir -p {{{self__dir}}}` + ' && ' +
        `cd {{{self__dir}}}` + ' && ' +
        `curl -sSL '` +
        `https://releases.hashicorp.com/terraform/{{{self__version}}}/` +
        `{{{self__zip}}}'` +
        `> '{{{self__zip}}}'` + ` && ` +
        `unzip -o '{{{self__zip}}}'`
    })

    this.runtime.deps.push({
      type: 'App',
      name: 'terraformInventory',
      range: '0.6.0',
      version: '0.6',
      dir: '{{{options__toolsDir}}}/terraform-inventory/{{{self__version}}}',
      exe: `{{{self__dir}}}/terraform-inventory`,
      zip:
        `terraform-inventory` + `_` +
        `{{{self__version}}}` + `_` +
        '{{{os__platform}}}' + `_` +
        `{{{os__arch}}}.zip`,
      cmdVersion: '{{{self__exe}}} --version',
      versionTransformer (stdout) {
        let version = `${stdout}`.trim().split('\n')[0].split(/\s+/).pop().replace('v', '')
        version = version.replace(/^(\d+\.\d+)/, '$1.0')
        return version
      },
      cmdInstall:
        `mkdir -p {{{self__dir}}}` + ' && ' +
        `cd {{{self__dir}}}` + ' && ' +
        `curl -sSL '` +
        `https://github.com/adammck/terraform-inventory/releases/download/` +
        `v{{{self__version}}}/` +
        `{{{self__zip}}}'` +
        `> '{{{self__zip}}}'` + ` && ` +
        `unzip -o '{{{self__zip}}}'`
    })

    this.runtime.deps.push({
      type: 'App',
      name: 'pip',
      exe: 'pip',
      version: '7.1.2',
      range: `>= {{{self__version}}}`,
      cmdVersion: '{{{self__exe}}} --version',
      versionTransformer (stdout) {
        const version = `${stdout}`.trim().split('\n')[0].split(/\s+/)[1].replace('v', '')
        return version
      },
      cmdInstall: 'sudo easy_install --upgrade pip'
    })

    this.runtime.deps.push({
      type: 'App',
      name: 'ansible',
      range: `>= 2.0.0`,
      version: '2.0.0.2',
      dir: '{{{options__toolsDir}}}/ansible/{{{self__version}}}',
      exe: `env PYTHONPATH={{{self__dir}}}/pip/lib/python2.7/site-packages {{{self__dir}}}/pip/bin/ansible`,
      exePlaybook: `env PYTHONPATH={{{self__dir}}}/pip/lib/python2.7/site-packages {{{self__dir}}}/pip/bin/ansible-playbook`,
      cmdVersion: 'env PYTHONPATH={{{self__dir}}}/pip/lib/python2.7/site-packages {{{self__exe}}} --version',
      versionTransformer (stdout) {
        let version = `${stdout}`.trim().split('\n')[0].split(/\s+/).pop().replace('v', '')
        let parts = version.split('.').slice(0, 3)
        version = parts.join('.')
        return version
      },
      cmdInstall:
        `mkdir -p {{{self__dir}}}` + ` && ` +
        `pip install` + ` ` +
        `--install-option='--prefix=pip'` + ` ` +
        `--ignore-installed` + ` ` +
        `--force-reinstall` + ` ` +
        `--root '{{{self__dir}}}'` + ` ` +
        `--upgrade` + ` ` +
        `--disable-pip-version-check` + ` ` +
        `ansible=={{{self__version}}}`
    })

    // @todo, we require setting `self` on each of the deps
    // hence special render treatment. Would be nice to hand that
    // over to a more powerful Utils.render in the future
    this.runtime.deps.forEach((dep, i) => {
      this.runtime.deps[i] = utils.render(dep, {
        self: dep,
        options: this.options,
        os: {
          platform: os.platform(),
          hostname: os.hostname(),
          arch: `${os.arch()}`.replace('x64', 'amd64')
        }
      })
    })

    // Render the non-deps, that are easier
    this.runtime.ssh = utils.render(this.runtime.ssh, {
      options: this.options,
      os: {
        platform: os.platform(),
        hostname: os.hostname(),
        arch: `${os.arch()}`.replace('x64', 'amd64')
      }
    })
    this.runtime.paths = utils.render(this.runtime.paths, {
      options: this.options,
      os: {
        platform: os.platform(),
        hostname: os.hostname(),
        arch: `${os.arch()}`.replace('x64', 'amd64')
      }
    })

    debug(this.runtime.paths)

    return cb(null)
  }
}

module.exports = Runtime
