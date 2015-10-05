Command = require "../Command"
mkdirp  = require "mkdirp"
semver  = require "semver"
async   = require "async"
debug   = require("depurar")("frey")
os      = require "os"

class Runtime extends Command
  main: (bootOptions, cb) ->
    @runtime.os =
      platform             : os.platform()
      hostname             : os.hostname()
      arch                 : "#{os.arch()}".replace "x64", "amd64"

    @runtime.versions =
      ansible              : "1.9.2"
      terraform            : "0.6.3"
      terraformInventory   : "0.5"
      pip                  : "7.1.2"

    @runtime.paths =
      ansibleCfg           : "#{@options.residu}/ansible.cfg"
      planFile             : "#{@options.residu}/terraform.plan"
      infraFile            : "#{@options.residu}/infra.tf.json"
      playbookFile         : "#{@options.residu}/config.yml"
      stateFile            : "#{@options.state}/terraform.tfstate"
      pythonLib            : "#{@options.tools}/pip/lib/python2.7/site-packages"
      ansibleExe           : "#{@options.tools}/pip/bin/ansible"

    @runtime.ssh =
      keypair_name         : "#{@options.app}"
      user                 : "ubuntu"
      email                : "hello@#{@options.app}"
      keyprv_file          : "#{@options.recipe}/#{@options.app}.pem"
      keypub_file          : "#{@options.recipe}/#{@options.app}.pub"
      # keypub_body: $(echo "$(cat "${ keypub_file: " 2>/dev/null)") || true
      # keypub_fingerprint: "$(ssh-keygen -lf ${@runtime.ssh_keypub_file} | awk '{print $2}')"


    @runtime.deps = []

    @runtime.deps.push
      type        : "dir"
      name        : "tools"
      dir         : "#{@options.tools}"

    @runtime.deps.push
      type        : "dir"
      name        : "state"
      dir         : "#{@options.state}"

    @runtime.deps.push
      type        : "dir"
      name        : "residu"
      dir         : "#{@options.residu}"

    @runtime.deps.push
      type        : "app"
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
      type        : "app"
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
      type        : "app"
      name        : "pip"
      exe         : "pip"
      range       : ">= #{@runtime.versions.pip}"
      cmdVersion  : "{exe} --version |head -n1 |awk '{print $2}'"
      cmdInstall  : "sudo easy_install --upgrade pip"

    @runtime.deps.push
      type        : "app"
      name        : "ansible"
      range       : "#{@runtime.versions.ansible}"
      exe         : "#{@options.tools}/pip/bin/ansible-playbook"
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
