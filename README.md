# Frey

<!-- badges/ -->
[![Build Status](https://travis-ci.org/kvz/frey.svg?branch=master)](https://travis-ci.org/kvz/frey)
[![Join the chat at https://gitter.im/kvz/frey](https://badges.gitter.im/kvz/frey.svg)](https://gitter.im/kvz/frey?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
<!-- /badges -->

*Warning: Frey is Alpha. Use it for new projects and goofing around, leave it for existing ones.*

Frey aims to be an all-in-one tool for developers and sysadmins to bring their app to production. 

## Table of Contents

- [Features](#features)
- [Run](#run)
- [Freyfile.toml](#freyfiletoml)
- [Install](#install)
- [Design goals](#design-goals)
- [Changelog](#changelog)
- [FAQ](#faq)
- [Comparison](#comparison)
- [License](#license)

## Features

Frey can:

- launch `infra` and operating systems (AWS, Google, Digital Ocean, etc)
- `install` software packages (Nginx, MySQL, etc)
- `setup` these packages
- `deploy` your app (via Rsync, S3, Git pull, etc)
- `restart` it (via Rsync, S3, Git pull, etc)

Frey will try to complete all of these steps, following along a 'chain of commands'. You're free to exclude commands, run a few, or just one. Chainable commands are indicated by ![](https://dl.dropboxusercontent.com/s/2kfqn2yocq4kq7p/2016-03-16%20at%2020.44.png):

<img alt="screen shot 2016-03-16 at 22 01 55" src="https://cloud.githubusercontent.com/assets/26752/13828617/bb8d8c6c-ebc2-11e5-89db-16baa3e226e7.png">


As you can see, Frey additionally provides commands to:

- `backup`
- `restore`
- connect to, or execute `remote` commands on your platform


## Freyfile.toml

So how does Frey know what to do? All of the actions are orchestrated from a single source of truth, a declarative `Freyfile.toml`, written in [TOML](https://github.com/toml-lang/toml#user-content-comparison-with-other-formats), and kept under the source control of your existing project. Preferably in its own directory, like `./infra`.

Here's an [example](https://github.com/kvz/frey/blob/master/test/scenario/digitalocean/Freyfile.toml) launching two web servers and a database server on Digital Ocean.

If you have a huge project and your Freyfile  size is becoming an issue, Frey will happilly look for any other `*.toml` files in the same directory as you can see in this [example](https://github.com/kvz/frey/tree/master/test/scenario/dynamodb) where we set up a DynamoDB server on AWS using 4 different `toml` files.

## Run

To run all the commands the belong to the chain (![](https://dl.dropboxusercontent.com/s/2kfqn2yocq4kq7p/2016-03-16%20at%2020.44.png)), just type `frey`

```bash
cd ~/code/myapp/infra
frey
```

This might not always be what you want.

You can step into the 'chain of commands' at any point. For so you'd type `frey deploy`, Frey would `deploy` your app, `restart` it, and `show` you the status.

You can also step out of the chain. If you only want a deploy without a restart, you can use `--bail`:

```bash
cd ~/code/myapp/infra
frey deploy --bail
```

You can also define a range, via `--bail-after`:

```bash
cd ~/code/myapp/infra
frey --bail-after plan
```

Making Frey execute all the steps, including `plan`, but then abort.

## Install

Frey would like to be installed globally for convenience:

```bash
npm install --global frey
```

But it will then choose a locally installed version if you have it available. This is great to pin a Frey version to an infra project. This way, you will know nothing that works now, can break in the future. So in **addition** to the global install, we recommend a local install in your project with exact version pinning:

```bash
cd ~/code/myapp
npm install --save --exact frey
```

A fixed version of Frey, installs fixed local versions of its dependencies (such as Ansible and Terraform) in local directories as well, all to keep chances of conflict slim, and chances of things working five years from now, optimal. More on this later.

## Design goals

- Frey should be ridiculously convenient, and hence offer auto-installation of requirements for instance
- Version pinning is holy
- An abundance of automated acceptance tests, that verify actual setting up and tearing down of infrastructure
- Written in ES6 JavaScript, transpiling builds to ES5

## Changelog

The changelog and todo list and can be found [here](CHANGELOG.md)

## Todo

The changelog and todo list and can be found [here](CHANGELOG.md)

## FAQ

### Can I use my existing Terraform definitions and Ansible playbooks?

There's an automatic converter that's not prefect but can save you 99% of the work if you want to convert your existing config files to a Freyfile.

Frey might support running playbook `.yaml` and `.tf` files natively in the future, you could wait for that, too. No promises though.

Beyond the instructions it's just a matter of moving the current state files that you have to Frey recognized places, and you're good to go.

<!-- @todo Link to tusd and uppy-server PRs as examples  -->

### Is Frey reinventing the wheel?

Frey is heavily relying on existing wheels. Frey is a convenience wrapper: a relatively small project, standing on the shoulders of two Giants: [Terraform](https://www.terraform.io/) and [Ansible](https://www.ansible.com/). I found these two make great companions for setting up infrastructure and software, although they weren't necessarily meant to be. What I've learned from marrying the two, I did not want to put into documentation. I wanted to codify it into a project of it's own, so that you could just `npm install --save frey`, and that's that.

### Where do I save my Freyfile, and what do I commit?

We recommend saving the Freyfile in an `infra` directory in your app. Frey will generate some files that like to be in the same directory as this file. Any file named `Frey-residu*` can be git ignored. The rest should be checked in.

Frey automatically commits changes to infra state.

Keeping infra the infra definition of a  project together with the app itself is convenient and allows both to move
at the same pace. If you revert to 2 years ago, you can also inspect the matching infra
from that time.

Of course, this is not right for every project, and you're free to create a dedicated `infra-myapp` Git repository and keep your Freyfile directly in its root.

## Comparison

### Comparison with Terraform

Terraform is our opinion the best infrastructure automation tool, but without Ansible / Chef / Puppet, it's mostly relying on shell scripts to set up servers. Hashicorp has many other tools to compensate, most noteworthy Otto, for which there is a separate comparison.

### Comparison with Ansible / Chef / Puppet

While it's true that some of these tools can launch infrastructure, they're not the right tool it. The main reason is that while they're okay-ish at managing state on a server, they weren't built to manage state 'outside' of it, what Terraform really shines in.

### Comparison with Otto

Seeing as Otto uses Terraform for infra orchestration and also installs software on it, there's a big conceptual overlap.

Where the projects differ is that Otto aims to be zero config, and Frey aims to be minimal yet complete config. Every component needs to be described, and saved under Git. This approach provides more control and flexibility at the tradeoff of it being more work to describe all your pieces. Wether this trade-off is acceptable depends on the project.

Frey does not offer setting up local environments yet, but this should be easy enough to add (as [we can make local connections](https://github.com/kvz/frey/blob/master/test/scenario/install/Freyfile.toml#L2) already) and is on the [roadmap](CHANGELOG.md).

## License

MIT
