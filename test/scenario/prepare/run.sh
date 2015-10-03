#!/usr/bin/env bash

# set -o pipefail
set -o errexit
set -o nounset
# set -o xtrace

# Set magic variables for current FILE & DIR
__dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
__file="${__dir}/$(basename "${BASH_SOURCE[0]}")"
__base="$(basename ${__file} .sh)"
__root="$(cd "$(dirname $(dirname $(dirname "${__dir}")))" && pwd)"

git init --quiet

# We don't want to enforce PIP versions since that's affects the
# user's global state.
# Yet, that's the only way to have equal install output.
# That's why we only care about the exit code in this test, and
# specify:
echo "FREY:SKIP_COMPARE_STDIO"

DEBUG=*:* "${__root}/node_modules/.bin/coffee" "${__root}/bin/frey" prepare \
  --force-yes \
  --verbose \
  --recipe "." \
  --bail

echo "Running help on all required tools"

(./frey/tools/pip/bin/ansible --help 2>&1 |grep version)
(./frey/tools/terraform --help 2>&1 |grep version)
(./frey/tools/terraform-inventory --help 2>&1 |grep version)
