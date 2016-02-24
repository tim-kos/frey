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

rm -f terraform.plan
rm -f "${__sysTmpDir}/frey-digitalocean"* || true

echo "WIP"
exit 1
# ex
#
#
# ssh -C -tt -vvv -o User=root -o ControlMaster=auto -o ControlPersist=60s -o ControlPath="/Users/kvz/.ansible/cp/ansible-ssh-%h-%p-%r" -o IdentityFile="/Users/kvz/code/frey/test/scenario/digitalocean/frey-digitalocean.pem" -o KbdInteractiveAuthentication=no -o PreferredAuthentications=gssapi-with-mic,gssapi-keyex,hostbased,publickey -o PasswordAuthentication=no -o User=root -o ConnectTimeout=10 107.170.43.164 /bin/sh -c 'mkdir -p $HOME/.ansible/tmp/ansible-tmp-1444209667.88-5193272149572 && echo $HOME/.ansible/tmp/ansible-tmp-1444209667.88-5193272149572'
#
# exit

function destroy() {
  echo "(maybe) Destroying.."
  "${__node}" "${__root}/${__codelib}/cli.js" destroy \
    --force-yes \
    --cfg-var="infra.settings.parallelism=1" \
  > /dev/null 2>&1 || true
}

if true; then destroy; fi
if true; then trap destroy EXIT; fi

"${__node}" "${__root}/${__codelib}/cli.js" install \
  --cfg-var "global.ssh.keysdir=." \
  --no-color \
  --verbose \
  --force-yes \
|| false

echo "Finished"
