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

echo "ACCPTST:STDIO_REPLACE_LONGTIMES"
echo "ACCPTST:STDIO_REPLACE_DURATIONS"

# PYTHONPATH="${HOME}/.frey/tools/ansible/2.0.0.2/pip/lib/python2.7/site-packages" \
#   "${HOME}/.frey/tools/ansible/2.0.0.2/pip/bin/ansible-playbook" \
#   --help
#
# exit

# echo WIP
# exit 0

rm -f terraform.plan
rm -f "${__sysTmpDir}/frey-install"* || true

# babel-node "${__root}/src/cli.js" install \
node "${__root}/lib/cli.js" install \
  --config "global.ssh.keysdir=${__sysTmpDir}" \
  --no-color \
  --verbose \
  --force-yes \
  --bail \
|| false

echo "Finished"
