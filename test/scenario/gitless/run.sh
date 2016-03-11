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
__node="node"; __codelib="lib"
if [[ "${OSTYPE}" == "darwin"* ]]; then
  __node="babel-node"; __codelib="src"
fi

rm -rf "${__sysTmpDir}/frey-gitless" || true
mkdir -p "${__sysTmpDir}/frey-gitless"
cp Freyfile.toml "${__sysTmpDir}/frey-gitless/"

"${__node}" "${__root}/${__codelib}/cli.js" validate \
  --verbose \
  --force-yes \
  --no-color \
  --cfg-var "global.ssh.keysdir=${__sysTmpDir}/frey-gitless" \
  --project-dir "${__sysTmpDir}/frey-gitless/" \
  --bail

rm -f Frey-residu* 2>&1 > /dev/null || true
