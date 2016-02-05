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
  TF_VAR_FREY_DO_TOKEN="${FREY_DO_TOKEN}" \
  TF_VAR_FREY__RUNTIME__SSH__KEYPUB_FILE="${__dir}/frey-digitalocean.pub" \
  ~/.frey/tools/terraform destroy \
    -no-color \
    -state=.frey/state/terraform.tfstate \
    -force \
  . #> /dev/null 2>&1 || true
    # -target=digitalocean_droplet.freytest-web \
}

destroy
trap destroy EXIT

"${__root}/node_modules/.bin/coffee" "${__root}/bin/frey" install \
  --sshkeys-dir "." \
  --no-color \
  --verbose \
  --force-yes \
|| false

echo "Finished"
