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

echo "Disabled due to a very unreliable trystack.org causing ~1/5 build failures. "
exit 1

echo "ACCPTST:STDIO_REPLACE_IPS"
echo "ACCPTST:STDIO_REPLACE_UUIDS"
echo "ACCPTST:STDIO_REPLACE_BIGINTS"
echo "ACCPTST:STDIO_REPLACE_LONGTIMES"
echo "ACCPTST:STDIO_REPLACE_DURATIONS"
echo "ACCPTST:STDIO_REPLACE_REMOTE_EXEC" # (remote-exec): Connecting to remote host via SSH...
echo "ACCPTST:STDIO_REPLACE_ELAPSED" # digitalocean_droplet.freytest-db: Still creating... (10s elapsed)

rm -f terraform.plan
rm -f "${__sysTmpDir}/frey-openstack"* || true

function destroy() {
  echo "(maybe) Destroying.."

  "${__node}" "${__root}/${__codelib}/cli.js" destroy \
    --force-yes \
    --cfg-var="global.terraformcfg.parallelism=1" \
  > /dev/null 2>&1 || true
}

if true; then destroy; fi
if true; then trap destroy EXIT; fi

rm -f *.pem 2>&1 > /dev/null || true

git init 2>&1 > /dev/null || true

"${__node}" "${__root}/${__codelib}/cli.js" config \
  --cfg-var "global.ssh.key_dir=${__dir}" \
  --no-color \
  --force-yes \
  --cfg-var="global.terraformcfg.parallelism=1" \
|| false

rm -f Frey-residu* 2>&1 > /dev/null || true
rm -f *.pem 2>&1 > /dev/null || true

echo "Finished"
