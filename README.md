# Frey

<!-- badges/ -->
[![Build Status](https://travis-ci.org/kvz/frey.svg?branch=master)](https://travis-ci.org/kvz/frey)
[![Coverage Status](https://coveralls.io/repos/kvz/frey/badge.svg?branch=master&service=github)](https://coveralls.io/github/kvz/frey?branch=master)
[![npm](https://img.shields.io/npm/v/frey.svg)](https://www.npmjs.com/package/frey) 
[![Dependency Status](https://david-dm.org/kvz/frey.png?theme=shields.io)](https://david-dm.org/kvz/frey)
[![Development Dependency Status](https://david-dm.org/kvz/frey/dev-status.png?theme=shields.io)](https://david-dm.org/kvz/frey#info=devDependencies)
<!-- /badges -->

Frey let's you launch web infrastructure with a single command. It uses
Ansible & Hashicorp's Terraform to to the heavy lifting.

![](https://upload.wikimedia.org/wikipedia/commons/3/38/Freyr_by_Johannes_Gehrts.jpg)

## Design goals

 - Frey should be ridiculously convenient, and hence offer auto-installation of requirements for instance

## Comparison

### With Otto

We use nearly all Hashicorp products in production and absolutely love it.
We will be looking to utilize Otto as well. 

However, we also felt the needed a tool that offered more in the way of
provisioning tailor-made setups.

Hashicorp acknowledges that Otto will be able to serve 99% of the
common use-cases. Frey aims to serve the remaining 1%.

When compared to Hashicorp's recently launched Otto, which also 
uses Terraform under the hood, Frey fills a void for people that feel:

 - Feel Otto is too opinionated about configuration for their needs
 - Feel the Customizations Otto offers are too high level for their needs and would like to have more fine grained control
 - Would like to deploy to other cloud vendors besides AWS
 - Don't want to rely solely on disk images / containers to provision their
servers
 - Want a tighter grip on dependencies via version pinning
 - Had hoped on more than bash scripts / Dockerfiles to do actual provisioning, such as the declarative style of Ansible Playbooks
 - Want to reuse existing Terraform or Ansible scripts, but would like some glue between those
 
It's possible that over time, enough of these differences will dissolve so that we can 
dissolve Frey as well.

Frey has some opinionated and magical parts, but less so than Otto.

You can define all of this in a single `Freyfile`. A Frefile is a recipe written in [TOML](https://github.com/toml-lang/toml).

Alternatively you can point Frey to your existing
Terraform `.tf` and Ansible `.yml` for creating web infrastructure.

What Frey is not good at:

 - Scaling Microservices
 - Dependencies with other Frey projects. Even though you could launch a heterogeneous cluster with different roles and apps across different cloud vendors - All of this should be defined in one Frey project.

## Install

```bash
npm install --global frey
```

## Run

Frey must be run in the root of the project that you want to set up infra for.
All infra description is supposed to be saved in `./frey/*`, but this can be configured.

There needs to be a `./.git` dir preset relative from your current directory.

Keeping infra recipes together with the app is convenient and allows both to move
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

#### One-off commands

All commands can be ran with `--bail` if you do not want to run the chain of commands.

There are also a few commands that do not belong to the chain, and are hence auto-bailing 
these are:

```
restore   : "Restore latest state backup"
remote    : "Execute a remote command - or opens console"
facts     : "Show Ansible facts"
```

### Dedicated infra repository

If you think it's better to keep the infra recipes outside of your own app code
for security reasons or similar, we recommend that alongside your `app` repo, you create an
`infra-app` repo, where you'll keep Frey's recipes in. We recommend you then keep the recipes
in the root, and run Frey with `--recipe-dir .`:

```bash
cd ~/code/infra-myapp
frey --recipe-dir .
```

### Multiple setups in one repository

Also possible, via:

```bash
cd ~/code/infra-myapp
frey --recipe-dir ./envs/production
```

## Recipes

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

For now, we only support

- Only OSX as workstation
- BASH, if you want to use autocompletion
- Ubuntu as remote server OS
- Git for version control - and Frey assumes your project has Git already set up

Frey is intended to service many use-cases and we'll work on removing some of these limitations as we go.

## Changelog

### Ideabox

Unreleased and unplanned todos

- [ ] Vagrant support
- [ ] Dynamodb scenario can evolve to be a full run, passing all stages
- [ ] Indent stdout/err
- [ ] More tests!
- [ ] How to implement different roles? Db/www/etc?
- [ ] Empty out and remove `Base` class?
- [ ] website: Console window like http://lebab.io/ ?
- [ ] website: Take uppy as a base maybe?
- [ ] website: Vagrant because it gave us a consistent and repeatable setup. And predictability 
- [ ] website: On the githubs
- [ ] Ditch yargs for mimimist, now that we can have autocomplete via liftoff already
- [ ] Consider detecting the User's config dir, and storing tools there, vs having a ~/.frey
- [ ] Enable DO support

### v0.3.2 (Unreleased)

- [ ] All config should come from Freyfile (think ssh). env only used for secrets. argv only for cwd
- [ ] Abstract both Terraform and Ansible as App classes
- [ ] - role: ":frey:/consul/v1.0.0"
- [ ] Make arg & env functions of all other commands, mimic Install's
- [ ] Deprecate a generic `Command._buildChildEnv` in favor of more specific Ansible/Terraform env building
- [ ] Fix that `this.runtime.Runtime` is thing now. Remove `Runtime` alltogehter?
- [ ] Terminology: Project vs Config vs Options. No more recipe
- [ ] Port install
- [ ] Port upload
- [ ] Port remote
- [ ] Port setup
- [ ] Port show 

### v0.3.1 (2016-02-19)

- [x] Signify chained via ▽
- [x] Use FREY_TARGETS or swap out terraformInventory, to target localhost on Travis and some Vagrant box on OSX with `install`
- [x] Get rid of `iterable`. Can be replaced by `_.find` often
- [x] Use flatten in utils.render. Then we can replace `{{{self.version}}}` as well as `{{{options.foobar}}}`
- [x] Tools should be saved under version number only. This way different versions of frey can use their own tested tools, while also still being able to share between same frey installs
- [x] Upgrade Terraform 
- [x] Upgrade Terraform-inventory 
- [x] Upgrade Ansible 
- [x] Replace mustache with lodash templating
- [x] Put `_transform` in a central place (utils?)
- [x] New command: `frey compile` that's prefixed to any chain, so you can trust your updates are present in residu, and have its configuration available too (ssh user for instance)
- [x] Merge chain & commands
- [x] A project's package.json should refer to a frey version, which should be used, vs the global one.
- [x] Ansible must run from configBase
- [-] If you do a `frey install` you must trust that at least the Ansible files are re-compiled
- [-] Re-introduce `init` for local prepare. Such as converting Freyfile to residu. Should be prefixed to chain of commands. Then a single install can benefit from it (remove the `refresh` from that acceptance test) and validation can be ran against it/them
- [x] Frey should traverse cwd upwards until it finds a Freyfile, and use that as default recipe dir
- [x] Switch to local npm install if available via LiftOff
- [x] Consider storing residu files in ~/.frey/tmp/
- [x] Default appname should be basename of dirname of Freyfile, not pwd
- [x] replace IPs and UUIDs, it's possible to disable SKIP_COMPARE_STDIO on the openstack acceptace test
- [x] Enable Openstack support after https://github.com/adammck/terraform-inventory/issues/14
- [x] Coveralls
- [x] Chalk
- [x] Glob & extend all \*.toml. Infra = terraform Config = Ansible.
- [x] @boot can be a list of functions in an array that's passed to async.series
- [x] Get a tf -> tf.json to launch, before splitting out over yml/toml etc
- [x] Patch up toml -> json
- [x] Pave way to meaningful output without DEBUG
- [x] Prompt "Dare I install"? With --force-yes override
- [x] Move ansibleExe to deps
- [x] Move versions to deps
- [x] Port Prepare Instals
- [x] Linux workstation support (Travis ;))
- [x] tooldir should be coupled with global Frey install and not per-project
- [-] /command/module/ 
- [-] Class.run becomes Class.main. The new run is Base.run. Which does a waterfall of @boot[], then @main
- [x] Test & document --no-colors
- [x] Implement a bailAfter, use it for DynamoDB scenario
- [x] Amazon free tier dynamodb Travis tests 
- [x] Runtime can be a command module, which can be prefixed to the runChain. Prepare can also be prepended to all. Afterwards, scenarios won't need to be ordered
- [x] `./Freyfile.toml` ? This means recipeDir defaults to `.`, and .git check should traverse upwards 'indefinitely'
- [x] Move validation to Validate class
- [x] Port Prepare SSH Keys
- [x] Port refresh
- [x] Port plan
- [x] Port launch
- [x] Port backup
- [x] Series/waterfall combination for boot 
- [x] Pass {} to first boot function. Use @options like all other methods to avoid confusion
- [x] Add (script to add) more encrypted cloud keys
- [x] exeScript should become exe. new exeScript prepends bash -o
- [x] Rename integration to acceptance (test) https://en.wikipedia.org/wiki/Acceptance_testing
- [x] terraform -parallelism=1
