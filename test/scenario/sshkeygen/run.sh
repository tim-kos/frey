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


rm -f "${__sysTmpDir}/frey-sshkeygen."* || true
node "${__root}/lib/cli.js" \
# babel-node "${__root}/lib/cli.js" \
  --sshkeys-dir "${__sysTmpDir}" \
  --bail-after prepare

ls "${__sysTmpDir}/frey-sshkeygen."* || true

rm -f "${__sysTmpDir}/frey-sshkeygen.pub" || true
node "${__root}/lib/cli.js" \
# babel-node "${__root}/lib/cli.js" \
  --sshkeys-dir "${__sysTmpDir}" \
  --bail-after prepare

ls "${__sysTmpDir}/frey-sshkeygen."* || true
