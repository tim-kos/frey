module.exports = [
  { chained: true, name: 'compile', description: 'Compiles configuration and loads it' },
  { chained: true, name: 'prepare', description: 'Install dependencies like Terraform' },
  { chained: true, name: 'refresh', description: 'Refreshes current infra state and saves to terraform.tfstate' },
  { chained: true, name: 'validate', description: 'Checks your projects' },
  { chained: true, name: 'plan', description: 'Shows infra changes and saves in an executable plan' },
  { chained: true, name: 'backup', description: 'Backs up server state' },
  { chained: true, name: 'launch', description: 'Launches virtual machines at a provider' },
  { chained: true, name: 'install', description: 'Runs Ansible to install software packages & configuration templates' },
  { chained: true, name: 'deploy', description: 'Upload your own application(s)' },
  { chained: true, name: 'restart', description: 'Restart your own application(s) and its dependencies' },
  { chained: true, name: 'show', description: 'Displays active platform' },
  { chained: false, name: 'docbuild', description: 'Build docs' },
  { chained: false, name: 'restore', description: 'Restore latest state backup' },
  { chained: false, name: 'destroy', description: 'Destroy all that is in state' },
  { chained: false, name: 'remote', description: 'Execute a remote command - or opens console' }
]
