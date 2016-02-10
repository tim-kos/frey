'use strict'
import Command from '../Command'
// import mkdirp from 'mkdirp'
// import semver from 'semver'
import async from 'async'
import fs from 'fs'
// import depurar from 'depurar'; const debug = depurar('frey')
let os = require('os')

class Runtime extends Command {
  constructor (name, options, runtime) {
    super(name, options, runtime)
    this.boot = [
      '_findClosestRecipeGit'
    ]
  }

  _findClosestRecipeGit (cargo, cb) {
    return this._findClosestGit(this.options.recipeDir, filepath => {
      return cb(null, filepath)
    })
  }

  _findClosestGit (filepath, cb) {
    const parts = filepath.split('/')
    let paths = []
    let rem = ''

    for (let i = 0, part; i < parts.length; i++) {
      part = parts[i]
      if (!part) {
        continue
      }

      rem = `${rem}/${part}`
      paths.push(`${rem}/.git`)
    }

    // This operation is performed in parallel, but the results array will
    // be in the same order as the original. Hence, use the last/longest/closest
    // path that has Git.
    return async.reject(paths, fs.stat, results => {
      if (typeof results === 'undefined' || !results.length) {
        return cb(undefined)
      }

      return cb(results.pop())
    })
  }

  main (bootOptions, cb) {
    this.runtime.os = {
      platform: os.platform(),
      hostname: os.hostname(),
      arch: `${os.arch()}`.replace('x64', 'amd64')
    }

    this.runtime.versions = {
      ansible: '1.9.2',
      terraform: '0.6.6',
      terraformInventory: '0.6-pre',
      pip: '7.1.2'
    }

    this.runtime.paths = {
      recipeGit: this.bootCargo._findClosestRecipeGit,
      ansibleCfg: `${this.options.recipeDir}/Frey-residu-ansible.cfg`,
      planFile: `${this.options.recipeDir}/Frey-residu-terraform.plan`,
      infraFile: `${this.options.recipeDir}/Frey-residu-infra.tf.json`,
      playbookFile: `${this.options.recipeDir}/Frey-residu-install.yml`,
      stateFile: `${this.options.recipeDir}/Frey-state-terraform.tfstate`,
      pythonLib: `${this.options.toolsDir}/pip/lib/python2.7/site-packages`
    }

    this.runtime.ssh = {
      email: `${this.options.user}@${this.options.app}.freyproject.io`,
      keypair_name: `${this.options.app}`,
      keyprv_file: `${this.options.sshkeysDir}/frey-${this.options.app}.pem`,
      keypub_file: `${this.options.sshkeysDir}/frey-${this.options.app}.pub`,
      user: 'ubuntu'
    }
      // keypub_body: $(echo "$(cat "${ keypub_file: " 2>/dev/null)") || true
      // keypub_fingerprint: "$(ssh-keygen -lf ${@runtime.ssh_keypub_file} | awk '{print $2}')"

    this.runtime.deps = []

    this.runtime.deps.push({
      type: 'Dir',
      name: 'toolsDir',
      dir: `${this.options.toolsDir}`
    })

    this.runtime.deps.push({
      type: 'Dir',
      name: 'recipeDir',
      dir: `${this.options.recipeDir}`
    })

    this.runtime.deps.push({
      type: 'Dir',
      name: 'sshkeysDir',
      dir: `${this.options.sshkeysDir}`
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
      range: `${this.runtime.versions.terraform}`,
      exe: `${this.options.toolsDir}/terraform`,
      zip: [
        'terraform',
        this.runtime.versions.terraform,
        this.runtime.os.platform,
        `${this.runtime.os.arch}.zip`
      ].join('_'),
      cmdVersion: '{{{exe}}} --version',
      versionTransformer (stdout) {
        const version = `${stdout}`.trim().split('\n')[0].split(/\s+/).pop().replace('v', '')
        return version
      },
      cmdInstall: [
        `cd ${this.options.toolsDir}`,
        [
          "curl -sSL '",
          `https://releases.hashicorp.com/terraform/${this.runtime.versions.terraform}/`,
          "{{{zip}}}'",
          "> '{{{zip}}}'"
        ].join(''),
        "unzip -o '{{{zip}}}'"
      ].join(' && ')
    })

    this.runtime.deps.push({
      type: 'App',
      name: 'terraformInventory',
      range: `${this.runtime.versions.terraformInventory}`.replace(/^(\d+\.\d+)/, '$1.0'),
      exe: `${this.options.toolsDir}/terraform-inventory`,
      zip: [
        'terraform-inventory',
        this.runtime.versions.terraformInventory,
        this.runtime.os.platform,
        `${this.runtime.os.arch}.zip`
      ].join('_'),
      cmdVersion: '{{{exe}}} --version',
      versionTransformer (stdout) {
        let version = `${stdout}`.trim().split('\n')[0].split(/\s+/).pop().replace('v', '')
        version = version.replace(/^(\d+\.\d+)/, '$1.0')
        return version
      },
      cmdInstall: [
        `cd ${this.options.toolsDir}`,
        [
          "curl -sSL '",
          'https://github.com/adammck/terraform-inventory/releases/download/',
          `v${this.runtime.versions.terraformInventory}/`,
          "{{{zip}}}'",
          "> '{{{zip}}}'"
        ].join(''),
        "unzip -o '{{{zip}}}'"
      ].join(' && ')
    })

    this.runtime.deps.push({
      type: 'App',
      name: 'pip',
      exe: 'pip',
      range: `>= ${this.runtime.versions.pip}`,
      cmdVersion: '{{{exe}}} --version',
      versionTransformer (stdout) {
        const version = `${stdout}`.trim().split('\n')[0].split(/\s+/)[1].replace('v', '')
        return version
      },
      cmdInstall: 'sudo easy_install --upgrade pip'
    })

    this.runtime.deps.push({
      type: 'App',
      name: 'ansible',
      range: `${this.runtime.versions.ansible}`,
      exe: `${this.options.toolsDir}/pip/bin/ansible`,
      exePlaybook: `${this.options.toolsDir}/pip/bin/ansible-playbook`,
      cmdVersion: '{{{exe}}} --version',
      versionTransformer (stdout) {
        const version = `${stdout}`.trim().split('\n')[0].split(/\s+/).pop().replace('v', '')
        return version
      },
      cmdInstall: [
        'pip install',
        "--install-option='--prefix=pip'",
        '--ignore-installed',
        '--force-reinstall',
        `--root '${this.options.toolsDir}'`,
        '--upgrade',
        '--disable-pip-version-check',
        `ansible==${this.runtime.versions.ansible}`
      ].join(' ')
    })

    return cb(null)
  }
}

module.exports = Runtime
