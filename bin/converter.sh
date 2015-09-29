#!/usr/bin/env bash

set -o pipefail
set -o errexit
set -o nounset
# set -o xtrace

project="${1:-tusd}"
tfFile="${2:-/Users/kvz/code/infra-tusd/envs/production/infra.tf}"
ansFile="${3:-/Users/kvz/code/infra-tusd/envs/production/main.yml}"
tfDir="$(dirname "${tfFile}")"
tfBase="$(basename "${tfFile}" .tf)"
jsonFile="${tfDir}/${tfBase}.tf.json"
csonFile="${tfDir}/${tfBase}.cson"
tomlFile="${tfDir}/frey.toml"
tomlFileConfig="${tfDir}/frey-config.toml"
tomlFileInfra="${tfDir}/frey-infra.toml"
yamlFile="${tfDir}/${tfBase}.yaml"

which hcltool || pip install pyhcl

cd "${GOPATH}"
if [ ! -d "${GOPATH}/src/github.com/dbohdan/remarshal" ]; then
  go get github.com/dbohdan/remarshal
fi

echo "Writing '${jsonFile}'"
hcltool "${tfFile}" "${jsonFile}"

cd "${GOPATH}/src/github.com/dbohdan/remarshal"
echo "Writing '${tomlFileInfra}'"
go run remarshal.go -if json -of toml -wrap infra -i "${jsonFile}" > "${tomlFileInfra}"

echo "Writing '${tomlFileConfig}'"
go run remarshal.go -if yaml -of toml -wrap config -i "${ansFile}" > "${tomlFileConfig}"

echo "Writing '${tomlFile}'"
cat "${tomlFileInfra}" "${tomlFileConfig}"  > "${tomlFile}"



# gsed -i -e 's@\[\[@\[@' "${tomlFile}"
# gsed -i -e 's@\]\]@\]@' "${tomlFile}"
#
# cat "${tomlFile}" | perl -pn -e 'BEGIN{undef $/;} s/\s+\[[a-z\.\_]+\]\n\n/\n\n/g' |tee "${tomlFile}" > /dev/null
#
# replace '[infra.resource.aws_security_group.fw-infra-tusd-main.ingress]' '[[infra.resource.aws_security_group.fw-infra-tusd-main.ingress]]' -- "${tomlFile}" "${tomlFile}"

cat "${tomlFile}"

echo "Moving '${tfFile}'"
mv "${tfFile}" "${tfFile}.bak-$(date)" 

cd ~/code/infra-tusd/envs/production
/Users/kvz/code/infra-tusd/bin/terraform/terraform plan \
  -refresh=false \
  -out=/Users/kvz/code/infra-tusd/envs/production/terraform.plan \
  -var x=y
exit 0
