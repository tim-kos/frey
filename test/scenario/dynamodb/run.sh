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

rm -f terraform.plan
rm -f "${__sysTmpDir}/frey-dynamodb"* || true

function destroy() {
  echo "(maybe) Destroying.."
  TF_VAR_FREY_AWS_ACCESS_KEY="${FREY_AWS_ACCESS_KEY}" \
  TF_VAR_FREY_AWS_SECRET_KEY="${FREY_AWS_SECRET_KEY}" \
  ~/.frey/tools/terraform destroy \
    -no-color \
    -target=aws_dynamodb_table.basic-dynamodb-table \
    -state=.frey/state/terraform.tfstate \
    -force \
  . > /dev/null 2>&1 || true
}

destroy
trap destroy EXIT

"${__root}/node_modules/.bin/coffee" "${__root}/bin/frey" \
  --sshkeys-dir "${__sysTmpDir}" \
  --no-color \
  --verbose \
  --force-yes \
  --bail-after launch \
|| false

echo "Finished"
