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
__node="node"
if [[ "${OSTYPE}" == "darwin"* ]]; then
  __node="babel-node"
fi

rm -f terraform.plan
rm -f "${__sysTmpDir}/frey-dynamodb"* || true

function destroy() {
  echo "(maybe) Destroying.."
  "${__node}" "${__root}/lib/cli.js" destroy \
    --force-yes \
    --cfg-var="infra.settings.parallelism=1" \
  > /dev/null 2>&1 || true

  # @todo: Do we really need a target when destroying?
  # -target=aws_dynamodb_table.basic-dynamodb-table \
}

if true; then destroy; fi
if true; then trap destroy EXIT; fi

"${__node}" "${__root}/lib/cli.js" \
  --cfg-var "global.ssh.keysdir=${__sysTmpDir}" \
  --no-color \
  --verbose \
  --force-yes \
  --bail-after launch \
|| false

echo "Finished"
