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

echo "FREY:STDIO_SKIP_COMPARE"
echo "FREY:STDIO_REPLACE_IPS"
echo "FREY:STDIO_REPLACE_UUIDS"
echo "FREY:STDIO_REPLACE_REMOTE_EXEC" # (remote-exec): Connecting to remote host via SSH...

rm -f terraform.plan
rm -f "${__sysTmpDir}/frey-openstack"* || true

function destroy() {
  echo "(maybe) Destroying.."
  TF_VAR_FREY_OPENSTACK_TENANT_NAME="${FREY_OPENSTACK_TENANT_NAME}" \
  TF_VAR_FREY_OPENSTACK_EXTERNAL_GATEWAY="${FREY_OPENSTACK_EXTERNAL_GATEWAY}" \
  TF_VAR_FREY_OPENSTACK_PROJECT_NAME="${FREY_OPENSTACK_PROJECT_NAME}" \
  TF_VAR_FREY_OPENSTACK_PASSWORD="${FREY_OPENSTACK_PASSWORD}" \
  TF_VAR_FREY_OPENSTACK_AUTH_URL="${FREY_OPENSTACK_AUTH_URL}" \
  TF_VAR_FREY__RUNTIME__SSH__USER="ubuntu" \
  TF_VAR_FREY__RUNTIME__SSH__KEYPUB_FILE="${__dir}/frey-openstack.pub" \
  TF_VAR_FREY__RUNTIME__SSH__KEYPRV_FILE="${__dir}/frey-openstack.pem" \
  ~/.frey/tools/terraform destroy \
    -no-color \
    -state=.frey/state/terraform.tfstate \
    -force \
  .frey/residu > /dev/null 2>&1 || true
}

destroy
trap destroy EXIT

"${__root}/node_modules/.bin/coffee" "${__root}/bin/frey" refresh \
  --sshkeys "${__dir}" \
  --no-color \
  --verbose \
  --force-yes \
  --bailAfter launch \
|| false

# "${__root}/node_modules/.bin/coffee" "${__root}/bin/frey" remote \
#   --sshkeys "${__dir}" \
#   --no-color \
#   --verbose \
#   --force-yes \
#   --bail \
# || false

#
# "${__root}/node_modules/.bin/coffee" "${__root}/bin/frey" install \
#   --sshkeys "${__sysTmpDir}" \
#   --no-color \
#   --verbose \
#   --force-yes \
#   --bail \
# || false

echo "Finished"
