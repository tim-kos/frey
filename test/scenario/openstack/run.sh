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
    -state=Frey-state-terraform.tfstate \
    -force \
  . > /dev/null 2>&1 || true
}

if true; then destroy; fi
if true; then trap destroy EXIT; fi

node "${__root}/lib/cli.js" compile \
# babel-node "${__root}/src/cli.js" compile \
  --sshkeys-dir "${__dir}" \
  --no-color \
  --verbose \
  --force-yes \
  --terraform-parallelism=1 \
  --bailAfter install \
|| false

# If you want to test just the install (don't forget to disable destroys):
#
# node "${__root}/lib/cli.js" install \
#   --sshkeys-dir "${__dir}" \
#   --no-color \
#   --verbose \
#   --force-yes \
#   --terraform-parallelism=1 \
#   --bail \
# || false

echo "Finished"
