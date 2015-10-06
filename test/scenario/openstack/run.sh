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

# PYTHONPATH="${HOME}/.frey/tools/pip/lib/python2.7/site-packages" \
#   "${HOME}/.frey/tools/pip/bin/ansible" \
#   --help 2>&1
#
# exit

echo "WIP until https://github.com/adammck/terraform-inventory/issues/14"
exit 0

rm -f terraform.plan
rm -f "${TMPDIR:-/tmp}/frey-dynamodb"* || true

if false; then
  echo "(maybe) Destroying.."
  TF_VAR_FREY_OPENSTACK_TENANT_NAME="${FREY_OPENSTACK_TENANT_NAME}" \
  TF_VAR_FREY_OPENSTACK_PROJECT_NAME="${FREY_OPENSTACK_PROJECT_NAME}" \
  TF_VAR_FREY_OPENSTACK_PASSWORD="${FREY_OPENSTACK_PASSWORD}" \
  TF_VAR_FREY_OPENSTACK_AUTH_URL="${FREY_OPENSTACK_AUTH_URL}" \
  TF_VAR_FREY__RUNTIME__SSH__KEYPUB_FILE="" \
  ~/.frey/tools/terraform destroy \
    -no-color \
    -target=openstack_compute_instance_v2.freytest-server-1 \
    -state=.frey/state/terraform.tfstate \
    -force \
  .frey/residu #> /dev/null 2>&1 || true
fi

"${__root}/node_modules/.bin/coffee" "${__root}/bin/frey" refresh \
  --sshkeys "${__dir}" \
  --no-color \
  --verbose \
  --force-yes \
  --bailAfter install \
&& true
#
# "${__root}/node_modules/.bin/coffee" "${__root}/bin/frey" install \
#   --sshkeys "${TMPDIR:-/tmp}" \
#   --no-color \
#   --verbose \
#   --force-yes \
#   --bail \
# && true

echo "Finished"
