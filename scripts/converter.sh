#!/usr/bin/env bash
#
# Requires realpath, which can be found in:
#  - Ubuntu: sudo apt-get install coreutils
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
tomlFile="${tfDir}/${tfBase}.toml"

echo "Installing hcltool.."
(which hcltool || sudo -HE pip install pyhcl==0.1.15) >/dev/null 2>&1

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

echo "Writing '${jsonFile}'"
hcltool "${tfFile}" "${jsonFile}"

echo "Writing '${tomlFile}'"
${cmdRemarshal} -if json -of toml -wrap infra -i "${jsonFile}" > "${tomlFile}"
echo "" >> "${tomlFile}"

if [ -n "${ansCfgFile}" ]; then
  echo "Appending '${tomlFile}'"
  cat "${ansCfgFile}" \
    |sed 's@\[@[install.settings.@g' \
  >> "${tomlFile}"
  echo "" >> "${tomlFile}"
fi

if [ -n "${ansFile}" ]; then
  echo "Appending '${tomlFile}'"
  ${cmdRemarshal} -if yaml -of toml -wrap playbooks -i "${ansFile}" \
    |sed 's@\[playbooks@[install.playbooks@g' \
  >> "${tomlFile}"
  echo "" >> "${tomlFile}"
fi

echo "Reading '${tomlFile}'"
cat "${tomlFile}"

# echo "Moving '${tfFile}'"
# mv "${tfFile}" "${tfFile}.bak-$(date +%s)"

echo "Removing '${jsonFile}'"
rm -f "${jsonFile}"
