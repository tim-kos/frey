#!/usr/bin/env bash
#
# Requires realpath, which can be found in:
#  - Ubuntu: sudo apt-get install realpath
#  - OS X: brew install coreutils
#
# The other dependencies (pyhcl, remarshal) are auto-installed
#
set -o pipefail
set -o errexit
set -o nounset
# set -o xtrace

project="${1:-tusd}"
tfFile="$(realpath ${2:-/Users/kvz/code/infra-tusd/envs/production/infra.tf})"
ansFile="${3:-}"
ansCfgFile="${4:-}"
tfDir="$(dirname "${tfFile}")"
tfBase="$(basename "${tfFile}" .tf)"
jsonFile="${tfDir}/${tfBase}.tf.json"
csonFile="${tfDir}/${tfBase}.cson"
tomlUnformattedFile="${tfDir}/${tfBase}.unformatted.toml"
tomlFile="${tfDir}/${tfBase}.toml"
stamp="$(date +%s)"

__dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
__file="${__dir}/$(basename "${BASH_SOURCE[0]}")"
__base="$(basename ${__file} .sh)"
__root="$(dirname "${__dir}")"

# @todo We unfortunately have to run two versions of hcltool due to
# different bugs hurting both 0.1.15 and 0.2.0
# https://github.com/virtuald/pyhcl/issues/7
# When that is resolved, let's just have 1 version
function cmdHcltool020 () {
  env PYTHONPATH=~/.frey/tools/pyhcl/0.2.0/pip/lib/python2.7/site-packages \
    ~/.frey/tools/pyhcl/0.2.0/pip/bin/hcltool ${@}
}
function cmdHcltool015 () {
  env PYTHONPATH=~/.frey/tools/pyhcl/0.1.15/pip/lib/python2.7/site-packages \
    ~/.frey/tools/pyhcl/0.1.15/pip/bin/hcltool ${@}
}

echo "Installing remarshal.."
if !which remarshal 2>/dev/null; then
  if [[ "${OSTYPE}" == "darwin"* ]]; then
    go get github.com/dbohdan/remarshal
  else
    pushd /tmp
      wget https://github.com/dbohdan/remarshal/releases/download/v0.3.0/remarshal-0.3.0-linux-amd64.tar.gz
      tar -zxvf remarshal-0.3.0-linux-amd64.tar.gz
    popd
  fi
fi

if [[ "${OSTYPE}" == "darwin"* ]]; then
  cd "${GOPATH}/src/github.com/dbohdan/remarshal"
  cmdRemarshal="go run remarshal.go"
else
  cmdRemarshal="remarshal"
fi

echo "Converting '${tfFile}' to '${jsonFile}'"
cmdHcltool020 "${tfFile}" "${jsonFile}" 2> /dev/null || cmdHcltool015 "${tfFile}" "${jsonFile}"

echo "Writing '${tomlUnformattedFile}'"
${cmdRemarshal} -if json -of toml -wrap infra -i "${jsonFile}" > "${tomlUnformattedFile}"
echo "" >> "${tomlUnformattedFile}"

if [ -n "${ansCfgFile}" ]; then
  echo "Appending '${tomlUnformattedFile}'"
  cat "${ansCfgFile}" \
    |sed 's@\[@[global.ansiblecfg.@g' \
  >> "${tomlUnformattedFile}"
  echo "" >> "${tomlUnformattedFile}"
fi

if [ -n "${ansFile}" ]; then
  echo "Appending '${tomlUnformattedFile}'"
  ${cmdRemarshal} -if yaml -of toml -wrap playbooks -i "${ansFile}" \
    |sed 's@\[playbooks@[install.playbooks@g' \
  >> "${tomlUnformattedFile}"
  echo "" >> "${tomlUnformattedFile}"
fi

echo "Formatting '${tomlUnformattedFile}' to '${tomlFile}'"
node "${__root}/src/format.js" "${tomlUnformattedFile}" > "${tomlFile}"

echo "Archiving intermediate '${tomlUnformattedFile}' for debugging"
mv "${tomlUnformattedFile}" "${tomlUnformattedFile}.bak-${stamp}"

echo "Reading '${tomlFile}'"
cat "${tomlFile}"

echo "Archiving original '${tfFile}' for safety"
mv "${tfFile}" "${tfFile}.bak-${stamp}"

echo "Archiving intermediate '${jsonFile}' for debugging"
mv "${jsonFile}" "${jsonFile}.bak-${stamp}"
