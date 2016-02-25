# Changelog

## Ideabox

Unreleased and unplanned todos

- [ ] Vagrant support
- [ ] Dynamodb scenario can evolve to be a full run, passing all stages
- [ ] Indent stdout/err
- [ ] More tests!
- [ ] Empty out and remove `Base` class?
- [ ] website: Console window like http://lebab.io/ ?
- [ ] website: Take uppy as a base maybe?
- [ ] website: Vagrant because it gave us a consistent and repeatable setup. And predictability 
- [ ] website: On the githubs
- [ ] Ditch yargs for mimimist, now that we can have autocomplete via liftoff already
- [ ] Consider detecting the User's config dir, and storing tools there, vs having a ~/.frey
- [ ] Command's exe functions should mostly be in a util class
- [ ] Enable DO support
- [ ] Figure out local Pip installs so we can build on Travis `sudo: false` platform
- [ ] Abstract both Terraform and Ansible into App classes
- [ ] Remote state in S3 feature

## v0.3.3 (Unreleased)

- [ ] How to implement different roles? Db/www/etc?
- [ ] Research if ssh private keys can be saved in environment keys. Then we can add Travis goodness
- [ ] Add multi-projectfile example
- [ ] Add safety prompts for destructive Launches, and Destroy
- [ ] Implement commit: Safely commit state automatically
- [ ] Implement deploy
- [ ] Implement remote
- [ ] Implement restart
- [ ] Implement show / inspect

## v0.3.2 (2016-02-25)

- [ ] Release v0.3.2
- [x] Put most `paths` in `config`, and give them  more consistent names
- [x] Add library support so you can do `- role: ":frey:/consul/v1.0.0"`
- [x] Terminology: Project vs Config vs Options. No more recipe
- [x] Rename Launch to Infra
- [x] Remove config ambiguity and rename Compile to Config
- [x] Catch toml parsing errors in a nicer way (forget a quote, see what happens)
- [x] Deprecate `FREY__RUNTIME` in favor of `{{{}}}`
- [x] Rename ansibleCfg to settings (terraform parallelism is also a setting)
- [x] Make it so that any `FREY_` env var, is added as a ansible var and made available in env
- [x] Make it so that any `FREY_` env var, is added as a terraform `var` and made available in env
- [x] Add test scenario for compile
- [x] Move `terraform-parallelism` to global config
- [x] DRY up render (Prepare & Compile could share one implementation)
- [x] Strip Frey, move 'options.os' to Init (cliargs stay?). Remove options from constructors
- [x] Make `destroy` a feature of Frey so we don't have to rely on ENV vars in openstack `run.sh` destroy
- [-] Deprecate a generic `Command._buildChildEnv` in favor of more specific Ansible/Terraform env building
- [-] Make arg & env functions of all other commands, mimic Install's
- [x] All config should come from Freyfile (think ssh). env only used for secrets. argv only for cwd
- [x] Fix that `this.runtime.Runtime` is thing now. Remove `Runtime` alltogehter?
- [x] Let compile go before prepare so we can use (ssh) config in prepare

## v0.3.1 (2016-02-19)

- [x] Implement install
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
- [x] Frey should traverse cwd upwards until it finds a Freyfile, and use that as default project dir
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
- [x] `./Freyfile.toml` ? This means projectdir defaults to `.`, and .git check should traverse upwards 'indefinitely'
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
