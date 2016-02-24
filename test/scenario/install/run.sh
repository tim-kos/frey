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


echo "ACCPTST:STDIO_REPLACE_LONGTIMES"
echo "ACCPTST:STDIO_REPLACE_DURATIONS"

# PYTHONPATH="${HOME}/.frey/tools/ansible/2.0.0.2/pip/lib/python2.7/site-packages" \
#   "${HOME}/.frey/tools/ansible/2.0.0.2/pip/bin/ansible-playbook" \
#   --help
#
# exit

# echo WIP
# exit 0

rm -f terraform.plan
rm -f "${__sysTmpDir}/frey-install"* || true

env -i \
PATH=${PATH} \
USER=${USER} \
HOME=${HOME} \
FREY_SHOULD_BE_AS_VAR_IN_ANSIBLE=now \
"${__node}" "${__root}/${__codelib}/cli.js" install \
  --cfg-var "global.ssh.keysdir=${__sysTmpDir}" \
  --no-color \
  --verbose \
  --force-yes \
  --bail \
|| false

echo "Finished"
