Command = require "../Command"
mkdirp  = require "mkdirp"
semver  = require "semver"
async   = require "async"
fs      = require "fs"
debug   = require("depurar")("frey")
os      = require "os"

class Runtime extends Command
  boot: [
    "_findClosestStateGit"
    "_findClosestRecipeGit"
  ]

  _findClosestStateGit: (cargo, cb) ->
    @_findClosestGit @options.state, (filepath) ->
      cb null, filepath

  _findClosestRecipeGit: (cargo, cb) ->
    @_findClosestGit @options.recipe, (filepath) ->
      cb null, filepath

  _findClosestGit: (filepath, cb) ->
    parts    = filepath.split "/"
    paths    = []
    rem      = ""

    for part in parts
      if !part
        continue

      rem = "#{rem}/#{part}"
      paths.push "#{rem}/.git"

    # This operation is performed in parallel, but the results array will
    # be in the same order as the original. Hence, use the last/longest/closest
    # path that has Git.
    async.reject paths, fs.stat, (results) ->
      if !results?.length?
        return cb undefined

      cb results.pop()

  main: (bootOptions, cb) ->
    @runtime.os =
      platform           : os.platform()
      hostname           : os.hostname()
      arch               : "#{os.arch()}".replace "x64", "amd64"

    @runtime.versions =
      ansible            : "1.9.2"
      terraform          : "0.6.6"
      terraformInventory : "0.6-pre"
      pip                : "7.1.2"

    @runtime.paths =
      stateGit           : @bootCargo._findClosestStateGit
      recipeGit          : @bootCargo._findClosestRecipeGit
      ansibleCfg         : "#{@options.cwd}/frey-residu-ansible.cfg"
      planFile           : "#{@options.cwd}/frey-residu-terraform.plan"
      infraFile          : "#{@options.cwd}/frey-residu-infra.tf.json"
      playbookFile       : "#{@options.cwd}/frey-residu-install.yml"
      stateFile          : "#{@options.state}/terraform.tfstate"
      pythonLib          : "#{@options.tools}/pip/lib/python2.7/site-packages"

    @runtime.ssh =
      email              : "#{@options.user}@#{@options.app}.freyproject.io"
      keypair_name       : "#{@options.app}"
      keyprv_file        : "#{@options.sshkeys}/frey-#{@options.app}.pem"
      keypub_file        : "#{@options.sshkeys}/frey-#{@options.app}.pub"
      user               : "ubuntu"
      # keypub_body: $(echo "$(cat "${ keypub_file: " 2>/dev/null)") || true
      # keypub_fingerprint: "$(ssh-keygen -lf ${@runtime.ssh_keypub_file} | awk '{print $2}')"

    @runtime.deps = []

    @runtime.deps.push
      type        : "Dir"
      name        : "tools"
      dir         : "#{@options.tools}"

    @runtime.deps.push
      type        : "Dir"
      name        : "recipe"
      dir         : "#{@options.recipe}"

    @runtime.deps.push
      type        : "Dir"
      name        : "state"
      dir         : "#{@options.state}"

    @runtime.deps.push
      type        : "Privkey"
      privkey     : "#{@runtime.ssh.keyprv_file}"
      pubkey      : "#{@runtime.ssh.keypub_file}"
      email       : "#{@runtime.ssh.email}"

    @runtime.deps.push
      type        : "Pubkey"
      privkey     : "#{@runtime.ssh.keyprv_file}"
      pubkey      : "#{@runtime.ssh.keypub_file}"
      email       : "#{@runtime.ssh.email}"

    @runtime.deps.push
      type        : "Privkey"
      privkey     : "#{@runtime.ssh.keyprv_file}"
      pubkey      : "#{@runtime.ssh.keypub_file}"

    @runtime.deps.push
      type        : "Permission"
      mode        : 0o400
      file        : "#{@runtime.ssh.keypub_file}"

    @runtime.deps.push
      type        : "Permission"
      mode        : 0o400
      file        : "#{@runtime.ssh.keyprv_file}"

    @runtime.deps.push
      type        : "App"
      name        : "terraform"
      range       : "#{@runtime.versions.terraform}"
      exe         : "#{@options.tools}/terraform"
      zip         : [
        "terraform"
        @runtime.versions.terraform
        @runtime.os.platform
        "#{@runtime.os.arch}.zip"
      ].join "_"
      cmdVersion  : "{{{exe}}} --version"
      versionTransformer: (stdout) ->
        version = "#{stdout}".trim().split("\n")[0].split(/\s+/).pop().replace("v", "")
        return version
      cmdInstall  : [
        "cd #{@options.tools}"
        [
          "curl -sSL '"
          "https://dl.bintray.com/mitchellh/terraform/"
          "{{{zip}}}'"
          "> '{{{zip}}}'"
        ].join("")
        "unzip -o '{{{zip}}}'"
      ].join " && "

    @runtime.deps.push
      type        : "App"
      name        : "terraformInventory"
      range       : "#{@runtime.versions.terraformInventory}".replace /^(\d+\.\d+)/, "$1.0"
      exe         : "#{@options.tools}/terraform-inventory"
      zip         : [
        "terraform-inventory"
        @runtime.versions.terraformInventory
        @runtime.os.platform
        "#{@runtime.os.arch}.zip"
      ].join "_"
      cmdVersion  : "{{{exe}}} --version"
      versionTransformer: (stdout) ->
        version = "#{stdout}".trim().split("\n")[0].split(/\s+/).pop().replace("v", "")
        version = version.replace /^(\d+\.\d+)/, "$1.0"
        return version
      cmdInstall  : [
        "cd #{@options.tools}"
        [
          "curl -sSL '"
          "https://github.com/adammck/terraform-inventory/releases/download/"
          "v#{@runtime.versions.terraformInventory}/"
          "{{{zip}}}'"
          "> '{{{zip}}}'"
        ].join ""
        "unzip -o '{{{zip}}}'"
      ].join " && "

    @runtime.deps.push
      type        : "App"
      name        : "pip"
      exe         : "pip"
      range       : ">= #{@runtime.versions.pip}"
      cmdVersion  : "{{{exe}}} --version"
      versionTransformer: (stdout) ->
        version = "#{stdout}".trim().split("\n")[0].split(/\s+/)[1].replace("v", "")
        return version
      cmdInstall  : "sudo easy_install --upgrade pip"

    @runtime.deps.push
      type        : "App"
      name        : "ansible"
      range       : "#{@runtime.versions.ansible}"
      exe         : "#{@options.tools}/pip/bin/ansible"
      exePlaybook : "#{@options.tools}/pip/bin/ansible-playbook"
      cmdVersion  : "{{{exe}}} --version"
      versionTransformer: (stdout) ->
        version = "#{stdout}".trim().split("\n")[0].split(/\s+/).pop().replace("v", "")
        return version
      cmdInstall  : [
        "pip install"
        "--install-option='--prefix=pip'"
        "--ignore-installed"
        "--force-reinstall"
        "--root '#{@options.tools}'"
        "--upgrade"
        "--disable-pip-version-check"
        "ansible==#{@runtime.versions.ansible}"
      ].join " "

    cb null

module.exports = Runtime
