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

"${__root}/scripts/converter.sh" \
  "converterApp" \
  "${__dir}/infra.tf" \
  "${__dir}/main.yml" \
  "${__dir}/ansible.cfg" \
|| false


mv infra.tf.bak-* infra.tf
rm -f *.bak-*
