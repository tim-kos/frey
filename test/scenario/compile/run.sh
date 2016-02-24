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
echo "ACCPTST:STDIO_SKIP_COMPARE"

rm -f "${__sysTmpDir}/frey-prepare"* || true

# node "${__root}/lib/cli.js" prepare \
babel-node "${__root}/src/cli.js" compile \
  --cfg-var "global.ssh.keysdir=${__sysTmpDir}" \
  --cfg-var "infra.provider.aws.region=eu-west-1" \
  --verbose \
  --projectdir "." \
  --bail

file=Freyfile.toml
echo "--> ${file}"
cat "${file}"
echo ""
for file in $(ls Frey-residu-*); do
  echo "--> ${file}"
  cat "${file}"
  echo ""
  echo ""
done

exit 0
