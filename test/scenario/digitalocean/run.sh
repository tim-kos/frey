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

echo WIP
exit

rm -f terraform.plan
rm -f "${TMPDIR:-/tmp}/frey-dynamodb"* || true


if false; then
  echo "(maybe) Destroying.."
  TF_VAR_FREY_DO_TOKEN="${FREY_DO_TOKEN}" \
  TF_VAR_FREY__RUNTIME__SSH__KEYPUB_FILE="${__dir}/frey-digitalocean.pub" \
  ~/.frey/tools/terraform destroy \
    -no-color \
    -state=.frey/state/terraform.tfstate \
    -force \
  .frey/residu #> /dev/null 2>&1 || true
    # -target=digitalocean_droplet.freytest-web \
fi

"${__root}/node_modules/.bin/coffee" "${__root}/bin/frey" install \
  --sshkeys "." \
  --no-color \
  --verbose \
  --force-yes \
|| false

echo "Finished"
