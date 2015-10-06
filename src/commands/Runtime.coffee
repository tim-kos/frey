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
    "_findClosestResiduGit"
  ]

  _findClosestStateGit: (options, cb) ->
    @_findClosestGit @options.state, (filepath) ->
      options["stateGit"] = filepath
      cb null, options

  _findClosestRecipeGit: (options, cb) ->
    @_findClosestGit @options.recipe, (filepath) ->
      options["recipeGit"] = filepath
      cb null, options

  _findClosestResiduGit: (options, cb) ->
    @_findClosestGit @options.residu, (filepath) ->
      options["residuGit"] = filepath
      cb null, options

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
      terraform          : "0.6.3"
      terraformInventory : "0.5"
      pip                : "7.1.2"

    @runtime.paths =
      stateGit           : bootOptions.stateGit
      residuGit          : bootOptions.residuGit
      recipeGit          : bootOptions.recipeGit
      ansibleCfg         : "#{@options.residu}/ansible.cfg"
      planFile           : "#{@options.residu}/terraform.plan"
      infraFile          : "#{@options.residu}/infra.tf.json"
      playbookFile       : "#{@options.residu}/install.yml"
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
      name        : "state"
      dir         : "#{@options.state}"

    @runtime.deps.push
      type        : "Dir"
      name        : "residu"
      dir         : "#{@options.residu}"

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
      type        : "PubkeyFingerprint"
      pubkey      : "#{@runtime.ssh.keypub_file}"

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
      cmdVersion  : "{exe} --version |head -n1 |awk '{print $NF}'"
      cmdInstall  : [
        "cd #{@options.tools}"
        [
          "curl -sSL '"
          "https://dl.bintray.com/mitchellh/terraform/"
          "{zip}'"
          "> '{zip}'"
        ].join("")
        "unzip -o '{zip}'"
      ].join " && "

    @runtime.deps.push
      type        : "App"
      name        : "terraformInventory"
      range       : "#{@runtime.versions.terraformInventory}"
      exe         : "#{@options.tools}/terraform-inventory"
      zip         : [
        "terraform-inventory"
        @runtime.versions.terraformInventory
        @runtime.os.platform
        "#{@runtime.os.arch}.zip"
      ].join "_"
      cmdVersion  : "{exe} --version |head -n1 |awk '{print $NF \".0\"}'"
      cmdInstall  : [
        "cd #{@options.tools}"
        [
          "curl -sSL '"
          "https://github.com/adammck/terraform-inventory/releases/download/"
          "v#{@runtime.versions.terraformInventory}/"
          "{zip}'"
          "> '{zip}'"
        ].join ""
        "unzip -o '{zip}'"
      ].join " && "

    @runtime.deps.push
      type        : "App"
      name        : "pip"
      exe         : "pip"
      range       : ">= #{@runtime.versions.pip}"
      cmdVersion  : "{exe} --version |head -n1 |awk '{print $2}'"
      cmdInstall  : "sudo easy_install --upgrade pip"

    @runtime.deps.push
      type        : "App"
      name        : "ansible"
      range       : "#{@runtime.versions.ansible}"
      exe         : "#{@options.tools}/pip/bin/ansible"
      exePlaybook : "#{@options.tools}/pip/bin/ansible-playbook"
      cmdVersion  : "{exe} --version |head -n1 |awk '{print $NF}'"
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
