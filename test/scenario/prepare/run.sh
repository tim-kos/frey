#!/usr/bin/env bash

# Running prepare before other scenarios is important on Travis,
# so that stdio can diverge - and we can enforce stricter
# stdio comparison on all other tests.

# set -o pipefail
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

# We don't want to enforce PIP versions since that's affects the
# user's global state.
# Yet, that's the only way to have equal install output.
# That's why we only care about the exit code in this test, and
# specify:
echo "FREY:STDIO_SKIP_COMPARE"

rm -f "${__sysTmpDir}/frey-prepare"* || true

node --harmony"${__root}/bin/frey" prepare \
  --force-yes \
  --sshkeys-dir "${__sysTmpDir}" \
  --verbose \
  --recipe-dir "." \
  --bail

echo "Running help on all required tools"

(PYTHONPATH="${HOME}/.frey/tools/pip/lib/python2.7/site-packages" "${HOME}/.frey/tools/pip/bin/ansible" --help 2>&1 |grep version)
("${HOME}/.frey/tools/terraform" --help 2>&1 |grep version)
("${HOME}/.frey/tools/terraform-inventory" --help 2>&1 |grep version)

echo "All tools were able to execute"

exit 0
