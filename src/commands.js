module.exports = [
  { chained: true, name: 'config', description: 'Loads, merges, renders, writes configuration' },
  { chained: true, name: 'deps', description: 'Loads dependency definitions' },
  { chained: true, name: 'prepare', description: 'Installs dependencies like Terraform' },
  { chained: true, name: 'refresh', description: 'Refreshes current infra state and saves to terraform.tfstate' },
  { chained: true, name: 'validate', description: 'Checks your projects' },
  { chained: true, name: 'plan', description: 'Shows infra changes and saves in an executable plan' },
  { chained: true, name: 'backup', description: 'Backs up server state' },
  { chained: true, name: 'infra', description: 'Launches virtual machines at a provider' },
  { chained: true, name: 'install', description: 'Runs Ansible to install software packages' },
  { chained: true, name: 'setup', description: 'Runs Ansible to setup configuration templates & restart software packages' },
  { chained: true, name: 'deploy', description: 'Upload your own application(s)' },
  { chained: true, name: 'restart', description: 'Restart your own application' },
  { chained: true, name: 'show', description: 'Displays active platform' },
  { chained: false, name: 'docbuild', description: 'Build docs' },
  { chained: false, name: 'restore', description: 'Restore latest state backup' },
  { chained: false, name: 'destroy', description: 'Destroy all that is in state' },
  { chained: false, name: 'remote', description: 'Execute a remote command - or opens console' }
]
