'use strict'
import Command from '../Command'
import utils from '../Utils'
// import depurar from 'depurar'; const debug = depurar('frey')

class Deps extends Command {
  main (cargo, cb) {
    let deps = []

    deps.push({
      type: 'Dir',
      name: 'process_tmp_dir',
      dir: '{{{init.paths.process_tmp_dir}}}'
    })

    deps.push({
      type: 'Dir',
      name: 'tools_dir',
      dir: '{{{config.global.tools_dir}}}'
    })

    deps.push({
      type: 'Dir',
      name: 'projectDir',
      dir: '{{{init.cliargs.projectDir}}}'
    })

    deps.push({
      type: 'Dir',
      name: 'global.ssh.key_dir',
      dir: '{{{config.global.ssh.key_dir}}}'
    })

    deps.push({
      type: 'Privkey',
      privkey: '{{{config.global.ssh.privatekey_file}}}',
      pubkey: '{{{config.global.ssh.publickey_file}}}',
      privkeyEnc: '{{{config.global.ssh.privatekey_enc_file}}}',
      email: '{{{config.global.ssh.email}}}'
    })

    deps.push({
      type: 'Pubkey',
      privkey: '{{{config.global.ssh.privatekey_file}}}',
      pubkey: '{{{config.global.ssh.publickey_file}}}',
      email: '{{{config.global.ssh.email}}}'
    })

    deps.push({
      type: 'PrivkeyEnc',
      privkey: '{{{config.global.ssh.privatekey_file}}}',
      privkeyEnc: '{{{config.global.ssh.privatekey_enc_file}}}'
    })

    deps.push({
      type: 'Permission',
      mode: 0o400,
      file: '{{{config.global.ssh.publickey_file}}}'
    })

    deps.push({
      type: 'Permission',
      mode: 0o400,
      file: '{{{config.global.ssh.privatekey_file}}}'
    })

    deps.push({
      type: 'App',
      name: 'terraform',
      version: '0.6.14',
      range: '{{{self.version}}}',
      dir: '{{{config.global.tools_dir}}}/terraform/{{{self.version}}}',
      exe: '{{{self.dir}}}/terraform',
      zip:
        'terraform' + '_' +
        '{{{self.version}}}' + '_' +
        '{{{init.os.platform}}}' + '_' +
        '{{{init.os.arch}}}.zip',
      cmdVersion: '{{{self.exe}}} --version',
      versionTransformer (stdout) {
        const version = `${stdout}`.trim().split('\n')[0].split(/\s+/).pop().replace('v', '')
        return version
      },
      cmdInstall:
        'mkdir -p {{{self.dir}}}' + ' && ' +
        'cd {{{self.dir}}}' + ' && ' +
        'curl -sSL \'' +
        'https://releases.hashicorp.com/terraform/{{{self.version}}}/' +
        '{{{self.zip}}}\'' +
        '> \'{{{self.zip}}}\'' + ' && ' +
        'unzip -o \'{{{self.zip}}}\''
    })

    deps.push({
      type: 'App',
      name: 'terraformInventory',
      range: '0.6.0',
      version: '0.6',
      dir: '{{{config.global.tools_dir}}}/terraform-inventory/{{{self.version}}}',
      exe: '{{{self.dir}}}/terraform-inventory',
      zip:
        'terraform-inventory' + '_' +
        '{{{self.version}}}' + '_' +
        '{{{init.os.platform}}}' + '_' +
        '{{{init.os.arch}}}.zip',
      cmdVersion: '{{{self.exe}}} --version',
      versionTransformer (stdout) {
        let version = `${stdout}`.trim().split('\n')[0].split(/\s+/).pop().replace('v', '')
        version = version.replace(/^(\d+\.\d+)/, '$1.0')
        return version
      },
      cmdInstall:
        'mkdir -p {{{self.dir}}}' + ' && ' +
        'cd {{{self.dir}}}' + ' && ' +
        'curl -sSL \'' +
        'https://github.com/adammck/terraform-inventory/releases/download/' +
        'v{{{self.version}}}/' +
        '{{{self.zip}}}\'' +
        '> \'{{{self.zip}}}\'' + ' && ' +
        'unzip -o \'{{{self.zip}}}\''
    })

    deps.push({
      type: 'App',
      name: 'pip',
      exe: 'pip',
      version: '7.1.2',
      range: '>= {{{self.version}}}',
      cmdVersion: '{{{self.exe}}} --version',
      versionTransformer (stdout) {
        const version = `${stdout}`.trim().split('\n')[0].split(/\s+/)[1].replace('v', '')
        return version
      },
      cmdInstall: 'sudo easy_install --upgrade pip'
    })

    deps.push({
      type: 'App',
      name: 'pyhcl-0.1.15',
      range: '0.1.15',
      version: '0.1.15',
      dir: '{{{config.global.tools_dir}}}/pyhcl/{{{self.version}}}',
      exe: '{{{self.dir}}}/pip/bin/hcltool',
      cmdVersion: 'awk \'/^Version:/ {print $NF}\' {{{config.global.tools_dir}}}/pyhcl/{{{self.version}}}/pip/lib/python2.7/site-packages/pyhcl-{{{self.version}}}-py2.7.egg-info/PKG-INFO || true',
      versionTransformer (stdout) {
        return stdout.trim()
      },
      cmdInstall:
        'mkdir -p {{{self.dir}}}' + ' && ' +
        'pip install' + ' ' +
        '--install-option=\'--prefix=pip\'' + ' ' +
        '--ignore-installed' + ' ' +
        '--force-reinstall' + ' ' +
        '--root \'{{{self.dir}}}\'' + ' ' +
        '--upgrade' + ' ' +
        '--disable-pip-version-check' + ' ' +
        'pyhcl=={{{self.version}}}'
    })

    // @todo We unfortunately have to run two versions of hcltool due to
    // different bugs hurting both 0.1.15 and 0.2.0
    // https://github.com/virtuald/pyhcl/issues/7
    // When that is resolved, let's just have 1 version
    deps.push({
      type: 'App',
      name: 'pyhcl-0.2.0',
      range: '0.2.0',
      version: '0.2.0',
      dir: '{{{config.global.tools_dir}}}/pyhcl/{{{self.version}}}',
      exe: '{{{self.dir}}}/pip/bin/hcltool',
      cmdHcltool: 'env PYTHONPATH={{{self.dir}}}/pip/lib/python2.7/site-packages {{{self.exe}}} ',
      cmdVersion: 'awk \'/^Version:/ {print $NF}\' {{{config.global.tools_dir}}}/pyhcl/{{{self.version}}}/pip/lib/python2.7/site-packages/pyhcl-{{{self.version}}}-py2.7.egg-info/PKG-INFO || true',
      versionTransformer (stdout) {
        return stdout.trim()
      },
      cmdInstall:
        'mkdir -p {{{self.dir}}}' + ' && ' +
        'pip install' + ' ' +
        '--install-option=\'--prefix=pip\'' + ' ' +
        '--ignore-installed' + ' ' +
        '--force-reinstall' + ' ' +
        '--root \'{{{self.dir}}}\'' + ' ' +
        '--upgrade' + ' ' +
        '--disable-pip-version-check' + ' ' +
        'pyhcl=={{{self.version}}}'
    })

    deps.push({
      type: 'App',
      name: 'ansible',
      range: '>= 2.0.0',
      version: '2.0.0.2',
      dir: '{{{config.global.tools_dir}}}/ansible/{{{self.version}}}',
      exe: '{{{self.dir}}}/pip/bin/ansible',
      exePlaybook: '{{{self.dir}}}/pip/bin/ansible-playbook',
      env: {
        PYTHONPATH: '{{{parent.dir}}}/pip/lib/python2.7/site-packages'
      },
      cmdPlaybook: 'env PYTHONPATH={{{self.dir}}}/pip/lib/python2.7/site-packages {{{self.exePlaybook}}} ',
      cmdVersion: 'env PYTHONPATH={{{self.dir}}}/pip/lib/python2.7/site-packages {{{self.exePlaybook}}} --version',
      versionTransformer (stdout) {
        let version = `${stdout}`.trim().split('\n')[0].split(/\s+/).pop().replace('v', '')
        let parts = version.split('.').slice(0, 3)
        version = parts.join('.')
        return version
      },
      cmdInstall:
        'mkdir -p {{{self.dir}}}' + ' && ' +
        'pip install' + ' ' +
        '--install-option=\'--prefix=pip\'' + ' ' +
        '--ignore-installed' + ' ' +
        '--force-reinstall' + ' ' +
        '--root \'{{{self.dir}}}\'' + ' ' +
        '--upgrade' + ' ' +
        '--disable-pip-version-check' + ' ' +
        'ansible=={{{self.version}}}'
    })

    deps = utils.render(deps, this.runtime)

    cb(null, deps)
  }
}

module.exports = Deps
