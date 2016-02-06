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

We use an Amazon Free Tier account to run acceptance tests.

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
# Run all acceptance tests:
npm run test:acceptance
# Isolate just the dynamodb test:
SCENARIO=dynamodb npm run test:acceptance
# Save new fixtures
npm run save:acceptance:fixtures
```

## Developing scenarios

The `DEBUG` environment variable can be very helpful here"

```bash
cd test/scenario/dynamodb
DEBUG=*:* bash ./run.sh
```

## Check new versions of dependencies:

 - <https://github.com/ansible/ansible/blob/devel/CHANGELOG.md>
 - <https://github.com/hashicorp/terraform/blob/master/CHANGELOG.md>
 - <https://github.com/adammck/terraform-inventory/releases>
