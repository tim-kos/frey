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

git init --quiet

rm -f terraform.plan
rm -f "${TMPDIR:-/tmp}/frey-dynamodb"* || true

"${__root}/node_modules/.bin/coffee" "${__root}/bin/frey" \
  --sshkeys "${TMPDIR:-/tmp}" \
  --no-color \
  --verbose \
  --force-yes \
  --bail-after plan \
&& true
