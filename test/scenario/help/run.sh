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
__node="node"; __codelib="lib"
if [[ "${OSTYPE}" == "darwin"* ]]; then
  __node="babel-node"; __codelib="src"
fi

git init 2>&1 > /dev/null || true

"${__node}" "${__root}/${__codelib}/cli.js" --help --no-color
