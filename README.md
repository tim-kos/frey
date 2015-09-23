# Frey

<!-- badges/ -->
[![Build Status](https://travis-ci.org/kvz/frey.svg?branch=master)](https://travis-ci.org/kvz/frey)
[![Coverage Status](https://coveralls.io/repos/kvz/frey/badge.svg?branch=master)](https://coveralls.io/r/kvz/frey?branch=master)
[![npm](https://img.shields.io/npm/v/frey.svg)](https://www.npmjs.com/package/frey) 
[![Dependency Status](https://david-dm.org/kvz/frey.png?theme=shields.io)](https://david-dm.org/kvz/frey)
[![Development Dependency Status](https://david-dm.org/kvz/frey/dev-status.png?theme=shields.io)](https://david-dm.org/kvz/frey#info=devDependencies)
<!-- /badges -->


Named after the Norse fertility god, Frey makes it easy to conceive web infrastructure.

## Install

### Production

```bash
npm install --global frey
```

### Development

```bash
cd ~/code
git clone git@github.com:kvz/frey.git
cd frey
npm install
npm link # Makes /usr/local/bin/frey point to ~/code/frey/bin/frey instead of the global install
```

## Run

Frey must be run in the root of the project that you want to set up infra for.
All infra description is supposed to be saved in `./frey/*`, but this can be configured.

There needs to be a `./.git` dir preset relative from your current directory.

Keeping infra playbooks together with the app is convenient and allows both to move
at the same pace. If you revert to 2 years ago, you can also inspect the matching infra
from that time.

```bash
cd ~/code/myapp
frey
```

### Chains of Commands

Frey works by walking down a chain of commands. You can 'enter' the chain at any step,
and Frey by default will complete the following steps. The commands are as follows


```
init      : "Make current project Frey aware"
prepare   : "Install prerequisites"
refresh   : "Refreshes current infra state and saves to terraform.tfstate"
validate  : "Checks your docs"
plan      : "Shows infra changes and saves in an executable plan"
backup    : "Backs up server state"
launch    : "Launches virtual machines at a provider"
install   : "Runs Ansible to install software packages & configuration templates"
deploy    : "Upload your own application(s)"
restart   : "Restart your own application(s) and its dependencies"
show      : "Displays active platform"
```

For so you'd type `frey deploy`, Frey would deploy your app, restart it, and show
you the status.

#### One off commands

All commands can be ran with `--bail` if you do not want to run the chain of commands.

There are also a few commands that do not belong to the chain, these are:

```
restore   : "Restore latest state backup"
remote    : "Execute a remote command - or opens console"
facts     : "Show Ansible facts"
```

### Dedicated infra repository

If you think it's better to keep the infra playbooks outside of your own app code
for security reasons or similar, we recommend that alongside your `app` repo, you create an
`infra-app` repo, where you'll keep Frey's playbooks in. We recommend you then keep the playbooks
in the root, and run Frey with `--recipe .`:

```bash
cd ~/code/infra-myapp
frey --recipe .
```

### Multiple setups in one repository

Also possible, via:

```bash
cd ~/code/infra-myapp
frey --recipe ./envs/production
```

## Playbooks

Frey uses Terraform and Ansible to do the heavy lifting.



## Autocompletion of CLI arguments

### OSX

```bash
frey completion >> ~/.bash_profile 
source ~/.bash_profile 
```

### Linux

```bash
frey completion >> ~/.bashrc
source ~/.bashrc
```



## Limitations

- Only OSX workstation is supported for now
- Auto completion only works for bash
- Only works with Git, and assumes your project already has Git set up

## Todo

 - [x] Coveralls
 - [ ] Chalk
 - [ ] Switch to local npm install if available
 - [ ] Linux workstation support
