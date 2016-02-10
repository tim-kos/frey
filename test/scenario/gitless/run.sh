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

rm -rf "${__sysTmpDir}/frey-gitless" || true
mkdir -p "${__sysTmpDir}/frey-gitless"
cp Freyfile.toml "${__sysTmpDir}/frey-gitless/"

node "${__root}/lib/cli.js" validate \
# babel-node "${__root}/src/cli.js" validate \
  --verbose \
  --force-yes \
  --sshkeysDir "${__sysTmpDir}/frey-gitless/" \
  --recipeDir "${__sysTmpDir}/frey-gitless/" \
  --bail
