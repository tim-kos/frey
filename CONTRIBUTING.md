## PRs

We're welcoming PRs! If it's anything big, please first let us know.

PRs that don't pass our unit and acceptance tests, will not get merged. You're welcome to iterate and let our Travis CI setup assist you with this though.

## npm files

Not that Frey uses npm's [files](https://docs.npmjs.com/files/package.json#files) directive.
Meaning anything that you'd like to add to the module, needs to be added to `files` inside `package.json` as well.

## Development

```bash
cd ~/code
git clone git@github.com:kvz/frey.git
cd frey
npm install
npm link # Makes /usr/local/bin/frey point to ~/code/frey/bin/frey instead of the global install
```

## Converting Terraform HCL & Ansible YML to unified Frey TOML

```bash
scripts/converter.sh \
  tusd \
  ~/code/infra-tusd/envs/production/infra.tf \
  ~/code/infra-tusd/envs/production/main.yml
``` 

## Testing scenarios

We use (among others) an Amazon Free Tier account to run acceptance tests.

It credentials are available to Travis via encrypted environment variables.

If you want to run acceptance tests yourself locally, you can supply (the) 
credentials as such:

```bash
echo 'export FREY_AWS_ACCESS_KEY=XXXXX
export FREY_AWS_SECRET_KEY=YYYYYYYYY
' > env.sh # This file is kept out of Git
```

Now you can:

```bash
# Load secrets
source env.sh
# Run all acceptance tests:
npm run acceptance
# Isolate just the dynamodb test:
SCENARIO=dynamodb npm run acceptance
# Save new fixtures
npm run acceptance:savefixtures
```

## Developing scenarios

The `DEBUG` environment variable can be very helpful here"

```bash
cd test/scenario/dynamodb
source ../../../env.sh && env DEBUG=*:* bash run.sh
```

## Recommended Editor Plugins

### Atom

- <https://atom.io/packages/atom-jinja2>
- <https://atom.io/packages/atom-alignment>
- <https://atom.io/packages/language-terraform>

## Check new versions of dependencies:

- <https://github.com/ansible/ansible/blob/devel/CHANGELOG.md>
- <https://github.com/hashicorp/terraform/blob/master/CHANGELOG.md>
- <https://github.com/adammck/terraform-inventory/releases>
