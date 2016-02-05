module.exports = {
  prepare   : 'Install dependencies like Terraform',
  refresh   : 'Refreshes current infra state and saves to terraform.tfstate',
  validate  : 'Checks your recipes',
  plan      : 'Shows infra changes and saves in an executable plan',
  backup    : 'Backs up server state',
  launch    : 'Launches virtual machines at a provider',
  install   : 'Runs Ansible to install software packages & configuration templates',
  deploy    : 'Upload your own application(s)',
  restart   : 'Restart your own application(s) and its dependencies',
  show      : 'Displays active platform',

  docbuild  : 'Build docs',
  restore   : 'Restore latest state backup',
  remote    : 'Execute a remote command - or opens console'
}
