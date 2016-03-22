#!/usr/bin/env bash
# Frey. Copyright (c) 2016, Transloadit Ltd.
#
# This file:
#
#  - Walks over any FREY_ environment variable
#  - Adds encrypted keys ready for use to .travis.yml
#
# Run as:
#
#  ./encrypt.sh
#
# Authors:
#
#  - Kevin van Zonneveld <kevin@transloadit.com>

set -o pipefail
set -o errexit
set -o nounset
# set -o xtrace

# Set magic variables for current file & dir
__dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
__file="${__dir}/$(basename "${BASH_SOURCE[0]}")"
__base="$(basename ${__file} .sh)"
__root="$(dirname "${__dir}")"

# https://galaxy.ansible.com/jdauphant/nginx/
# https://galaxy.ansible.com/geerlingguy/mysql/

roles=(
  "deploy,carlosbuenosvinos.ansistrano-deploy,1.3.0,v1.3.0"
  "deploy,carlosbuenosvinos.ansistrano-deploy,1.4.0,v1.4.0"
  "rollback,carlosbuenosvinos.ansistrano-rollback,1.2.0,v1.2.0"
  "nodejs,geerlingguy.nodejs,2.1.1,v2.1.1"
  "redis,geerlingguy.redis,1.2.0,v1.2.0"
  "unattended-upgrades,jnv.unattended-upgrades,v1.2.0,v1.2.0"
  "munin,geerlingguy.munin,1.1.2,v1.1.2"
)
for role in "${roles[@]}"; do
  freyRole="$(echo "${role}" |awk -F"," '{print $1}')"
  ansiRole="$(echo "${role}" |awk -F"," '{print $2}')"
  ansiVersion="$(echo "${role}" |awk -F"," '{print $3}')"
  freyVersion="$(echo "${role}" |awk -F"," '{print $4}')"

  if [ ! -f "${__root}/roles/${freyRole}/${freyVersion}/README.md" ]; then
    ansible-galaxy install \
    --force \
    --roles-path "${__root}/roles/${freyRole}/${freyVersion}" \
    ${ansiRole},${ansiVersion}
    shopt -s dotglob nullglob # to also glob over hidden files
    mv "${__root}/roles/${freyRole}/${freyVersion}/${ansiRole}/"* "${__root}/roles/${freyRole}/${freyVersion}/"
    rmdir "${__root}/roles/${freyRole}/${freyVersion}/${ansiRole}/"
  fi

done
