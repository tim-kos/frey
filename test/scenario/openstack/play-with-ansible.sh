#!/usr/bin/env bash

set -o pipefail
set -o errexit
set -o nounset
# set -o xtrace

# Set magic variables for current FILE & DIR
__dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
__file="${__dir}/$(basename "${BASH_SOURCE[0]}")"
__base="$(basename ${__file} .sh)"
__root="$(cd "$(dirname $(dirname $(dirname "${__dir}")))" && pwd)"
__sysTmpDir="${TMPDIR:-/tmp}"
__sysTmpDir="${__sysTmpDir%/}" # <-- remove trailing slash on macosx


TF_STATE=/Users/kvz/code/frey/test/scenario/openstack/Frey-state-terraform.tfstate \
PYTHONPATH=/Users/kvz/.frey/tools/ansible/2.0.0.2/pip/lib/python2.7/site-packages \
ANSIBLE_CONFIG=/Users/kvz/code/frey/test/scenario/openstack/Frey-residu-ansible.cfg \
/usr/bin/python /Users/kvz/.frey/tools/ansible/2.0.0.2/pip/bin/ansible-playbook \
  -vvvv \
  --user=ubuntu \
  --private-key=/Users/kvz/code/frey/test/scenario/openstack/frey-openstack.pem \
  --inventory-file=/Users/kvz/.frey/tools/terraform-inventory/0.6/terraform-inventory \
  --sudo /Users/kvz/code/frey/test/scenario/openstack/Frey-residu-install.yml
