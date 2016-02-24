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

echo "ACCPTST:STDIO_REPLACE_IPS"
echo "ACCPTST:STDIO_REPLACE_UUIDS"
echo "ACCPTST:STDIO_REPLACE_BIGINTS"
echo "ACCPTST:STDIO_REPLACE_LONGTIMES"
echo "ACCPTST:STDIO_REPLACE_DURATIONS"
echo "ACCPTST:STDIO_REPLACE_REMOTE_EXEC" # (remote-exec): Connecting to remote host via SSH...

rm -f terraform.plan
rm -f "${__sysTmpDir}/frey-openstack"* || true

function destroy() {
  echo "(maybe) Destroying.."

  # babel-node "${__root}/src/cli.js" destroy \
  node "${__root}/lib/cli.js" destroy \
    --force-yes \
    --terraform-parallelism=1 \
  > /dev/null 2>&1 || true
}

if true; then destroy; fi
if true; then trap destroy EXIT; fi

# babel-node "${__root}/src/cli.js" compile \
node "${__root}/lib/cli.js" compile \
  --cfg-var "global.ssh.keysdir=${__dir}" \
  --no-color \
  --verbose \
  --force-yes \
  --terraform-parallelism=1 \
  --bailAfter install \
|| false

# If you want to test just the install (don't forget to disable destroys):
#
# # babel-node "${__root}/src/cli.js" install \
# node "${__root}/lib/cli.js" install \
#   --sshkeys-dir "${__dir}" \
#   --no-color \
#   --verbose \
#   --force-yes \
#   --terraform-parallelism=1 \
#   --bail \
# || false

echo "Finished"
