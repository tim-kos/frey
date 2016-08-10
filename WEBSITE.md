
## Tagline

Frey: an end-to-end sysadmin toolbelt for developers.

## hook

Frey takes your app from code to production. Frey can read a single configuration file (`Freyfile`) that you store with your app, under version control, and can then launch virtual instances on any cloud vendor, provision them with software packages and configuration, and deploy your app onto this cluster.

## cli display

```bash
$ mkdir infra
$ cd infra
$ vim Freyfile.toml
$ frey
```

## description

Frey detects differences between the platform you described in your `Freyfile` and the real-world situation, and makes all the changes necessary to make the real world adhere to you description.

Frey uses a combination of Terraform and Ansible under the hood to do the heavy lifting, meaning there's a [vast](http://docs.ansible.com/ansible/list_of_all_modules.html) [ecosystem](https://www.terraform.io/docs/providers/index.html) that we're tapping right into.

## features

- **plan & launch** infra. Based on Terraform, Frey let's you plan infra, and asks for confirmation if it detects destructive changes
- **provision** software packages such as Nginx and Redis. Frey comes bundled with roles so you only have to specify versions and vhosts
- **connect** to your app with ease, Frey handles SSH keys for you
- **encrypt** using a secret only you know, Frey can store ssh keys in Git. CI like travis can decrypt these, so you can have it deploy your app whenever there are changes
- **manage** single instances, or clusters across regions and cloud providers
- **deploy** your app 
- **rollback** your app to a previous version
- **override** any configuration stored in the Freyfile can be overridden at runtime via command-line arguments

it does so, keeping a few design goals in mind

- **convenience**, frey installs all of it's requirements so you don't have to
- **single configuration** describing the platform for your app, software requirements, and deploy strategy
- **pinned down dependencies**, if it works now, it should works in 5 years

## who uses it

Frey can be seen in the wild in these projects:

 - Uppy has a [Freyfile](https://github.com/transloadit/uppy-server/blob/master/infra/Freyfile.toml)
 that sets up an EC2 instance, and let's Travis CI deploy to it on every push to `master`.
 - Imagemagick has a [Freyfile](https://github.com/transloadit/infra-imagemagick/blob/frey/infra/Freyfile.toml) to set up their website from scratch. If anything 'bad' happens, frey is run to restore the infrastructure and software, as it was defined in the Freyfile.
 - tus.io has a [Freyfile](https://github.com/tus/infra-tusd/blob/frey/infra/Freyfile.toml) 
 that sets up an EC2 instance, and let's Travis CI deploy to it on every push to `master`.

If you're using Frey, let us know in an [issue](https://github.com/kvz/frey/issues/new).

## examples

### Launch one Digital Ocean droplet, called `my-app`

```toml
[infra.resource.digitalocean_droplet.myapp-web]
  image    = "ubuntu-14-04-x64"
  name     = "web-${count.index}"
  region   = "nyc2"
  size     = "512mb"
  count    = 1
```

### Make redis a requirement for your app

```toml
[[install.playbooks.roles]]
  role = "{{{init.paths.roles_dir}}}/redis/v1.2.0"
```

### Make Node.js a requirement for your app

```toml
[[install.playbooks.roles]]
  role           = "{{{init.paths.roles_dir}}}/nodejs/v2.1.1"
  nodejs_version = "4.x"
```

### Use rsync as de deployment strategy deployment

```toml
[[deploy.playbooks]]
  hosts = "my-app"
  name  = "Deploy my-app"

  [[deploy.playbooks.roles]]
    role                          = "{{{init.paths.roles_dir}}}/deploy/v1.4.0"
    ansistrano_deploy_from        = "{{ playbook_dir }}/.."
    ansistrano_deploy_to          = "/srv/my-app"
    ansistrano_deploy_via         = "rsync"
    ansistrano_owner              = "www-data"
    ansistrano_rsync_extra_params = "--exclude=.git* --exclude=env.* --exclude=node_modules"
    ansistrano_keep_releases      = 10

  # Upload env.sh separately
  [[deploy.playbooks.tasks]]
    copy = "src=../env.sh dest=/srv/my-app/current/env.sh mode=0600 owner=root group=root"
    name = "my-app | Upload environment"
    
[[restart.playbooks]]
  hosts = "my-app"
  name  = "Restart my-app"

  [[restart.playbooks.tasks]]
    action = "service name=my-app state=restarted"
    name   = "my-app | Restart"
```

## call to action

Try Frey now:

```bash
$ npm install --save --exact frey
```
