'use strict'
import Command from '../Command'
import utils from '../Utils'
import os from 'os'
import depurar from 'depurar'; const debug = depurar('frey')

class Runtime extends Command {
  main (bootOptions, cb) {
    this.runtime.paths = {
      ansibleCfg: `{{{options.recipeDir}}}/Frey-residu-ansible.cfg`,
      planFile: `{{{options.recipeDir}}}/Frey-residu-terraform.plan`,
      infraFile: `{{{options.recipeDir}}}/Frey-residu-infra.tf.json`,
      playbookFile: `{{{options.recipeDir}}}/Frey-residu-install.yml`,
      stateFile: `{{{options.recipeDir}}}/Frey-state-terraform.tfstate`
    }

    this.runtime.ssh = {
      email: `{{{options.user}}}@{{{options.app}}}.freyproject.io`,
      keypair_name: `{{{options.app}}}`,
      keyprv_file: `{{{options.sshkeysDir}}}/frey-{{{options.app}}}.pem`,
      keypub_file: `{{{options.sshkeysDir}}}/frey-{{{options.app}}}.pub`,
      user: 'ubuntu'
    }

    this.runtime.deps = []

    this.runtime.deps.push({
      type: 'Dir',
      name: 'toolsDir',
      dir: `{{{options.toolsDir}}}`
    })

    this.runtime.deps.push({
      type: 'Dir',
      name: 'recipeDir',
      dir: `{{{options.recipeDir}}}`
    })

    this.runtime.deps.push({
      type: 'Dir',
      name: 'sshkeysDir',
      dir: `{{{options.sshkeysDir}}}`
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
      range: `{{{self.version}}}`,
      dir: `{{{options.toolsDir}}}/terraform/{{{self.version}}}`,
      exe: `{{{self.dir}}}/terraform`,
      zip:
        `terraform` + `_` +
        `{{{self.version}}}` + `_` +
        '{{{os.platform}}}' + `_` +
        `{{{os.arch}}}.zip`,
      cmdVersion: '{{{self.exe}}} --version',
      versionTransformer (stdout) {
        const version = `${stdout}`.trim().split('\n')[0].split(/\s+/).pop().replace('v', '')
        return version
      },
      cmdInstall:
        `mkdir -p {{{self.dir}}}` + ' && ' +
        `cd {{{self.dir}}}` + ' && ' +
        `curl -sSL '` +
        `https://releases.hashicorp.com/terraform/{{{self.version}}}/` +
        `{{{self.zip}}}'` +
        `> '{{{self.zip}}}'` + ` && ` +
        `unzip -o '{{{self.zip}}}'`
    })

    this.runtime.deps.push({
      type: 'App',
      name: 'terraformInventory',
      range: '0.6.0',
      version: '0.6',
      dir: '{{{options.toolsDir}}}/terraform-inventory/{{{self.version}}}',
      exe: `{{{self.dir}}}/terraform-inventory`,
      zip:
        `terraform-inventory` + `_` +
        `{{{self.version}}}` + `_` +
        '{{{os.platform}}}' + `_` +
        `{{{os.arch}}}.zip`,
      cmdVersion: '{{{self.exe}}} --version',
      versionTransformer (stdout) {
        let version = `${stdout}`.trim().split('\n')[0].split(/\s+/).pop().replace('v', '')
        version = version.replace(/^(\d+\.\d+)/, '$1.0')
        return version
      },
      cmdInstall:
        `mkdir -p {{{self.dir}}}` + ' && ' +
        `cd {{{self.dir}}}` + ' && ' +
        `curl -sSL '` +
        `https://github.com/adammck/terraform-inventory/releases/download/` +
        `v{{{self.version}}}/` +
        `{{{self.zip}}}'` +
        `> '{{{self.zip}}}'` + ` && ` +
        `unzip -o '{{{self.zip}}}'`
    })

    this.runtime.deps.push({
      type: 'App',
      name: 'pip',
      exe: 'pip',
      version: '7.1.2',
      range: `>= {{{self.version}}}`,
      cmdVersion: '{{{self.exe}}} --version',
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
      dir: '{{{options.toolsDir}}}/ansible/{{{self.version}}}',
      exe: `{{{self.dir}}}/pip/bin/ansible`,
      exePlaybook: `{{{self.dir}}}/pip/bin/ansible-playbook`,
      cmdPlaybook: `env PYTHONPATH={{{self.dir}}}/pip/lib/python2.7/site-packages {{{self.exePlaybook}}} `,
      cmdVersion: 'env PYTHONPATH={{{self.dir}}}/pip/lib/python2.7/site-packages {{{self.exe}}} --version',
      versionTransformer (stdout) {
        let version = `${stdout}`.trim().split('\n')[0].split(/\s+/).pop().replace('v', '')
        let parts = version.split('.').slice(0, 3)
        version = parts.join('.')
        return version
      },
      cmdInstall:
        `mkdir -p {{{self.dir}}}` + ` && ` +
        `pip install` + ` ` +
        `--install-option='--prefix=pip'` + ` ` +
        `--ignore-installed` + ` ` +
        `--force-reinstall` + ` ` +
        `--root '{{{self.dir}}}'` + ` ` +
        `--upgrade` + ` ` +
        `--disable-pip-version-check` + ` ` +
        `ansible=={{{self.version}}}`
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
