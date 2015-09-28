#!/usr/bin/env bash

set -o pipefail
set -o errexit
set -o nounset
# set -o xtrace

project="${1}"
tfFile="${2}"
ansFile="${3}"
tfDir="$(dirname "${tfFile}")"
tfBase="$(basename "${tfFile}" .tf)"
jsonFile="${tfDir}/${tfBase}.json"
csonFile="${tfDir}/${tfBase}.cson"
tomlFile="${tfDir}/${tfBase}.toml"
yamlFile="${tfDir}/${tfBase}.yaml"

if egrep 'variable "[A-Z_]+" {}' "${tfFile}"; then
  echo "Please first add descriptions or defaults to your variables"
  echo "\${EDITOR} \"${tfFile}\""
  exit 1
fi

cd "${GOPATH}"
if [ ! -d "${GOPATH}/src/github.com/hashicorp/terraform" ]; then
  go get github.com/hashicorp/terraform
fi
if [ ! -d "${GOPATH}/src/github.com/dbohdan/remarshal" ]; then
  go get github.com/dbohdan/remarshal
fi
if [ ! -d "${GOPATH}/src/github.com/hashicorp/hcl" ]; then
  mkdir -p "${GOPATH}/src/github.com/hashicorp"
  git clone https://github.com/hashicorp/hcl.git
  cd "${GOPATH}/src/github.com/hashicorp" && git checkout pr/24
fi

cd "${GOPATH}/src/github.com/hashicorp/hcl"
echo "Writing '${jsonFile}'"
go run cmd/hcl2json/main.go "${tfFile}" > "${jsonFile}"

cd "${GOPATH}/src/github.com/dbohdan/remarshal"
echo "Writing '${tomlFile}'"
go run remarshal.go -if json -of toml -wrap terraform -i "${jsonFile}" > "${tomlFile}"

cd "${GOPATH}/src/github.com/dbohdan/remarshal"
echo "Writing '${yamlFile}'"
go run remarshal.go -if json -of yaml -wrap terraform -i "${jsonFile}" > "${yamlFile}"

echo "Appending '${tomlFile}'"
go run remarshal.go -if yaml -of toml -wrap ansible -i "${ansFile}" >> "${tomlFile}"

echo "Appending '${yamlFile}'"
go run remarshal.go -if yaml -of yaml -wrap ansible -i "${ansFile}" >> "${yamlFile}"

echo "Writing '${jsonFile}'"
go run remarshal.go -if yaml -of json -i "${yamlFile}" > "${jsonFile}"

echo "Writing '${csonFile}'"
json2cson "${jsonFile}" > "${csonFile}"

# echo "Removing '${jsonFile}'"
# rm -f "${jsonFile}"
