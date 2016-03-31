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

# https://galaxy.ansible.com/geerlingguy/mysql/

roles=(
  "deploy;carlosbuenosvinos.ansistrano-deploy,1.3.0;v1.3.0"
  "deploy;carlosbuenosvinos.ansistrano-deploy,1.4.0;v1.4.0"
  "rollback;carlosbuenosvinos.ansistrano-rollback,1.2.0;v1.2.0"
  "nodejs;geerlingguy.nodejs,2.1.1;v2.1.1"
  "redis;geerlingguy.redis,1.2.0;v1.2.0"
  "unattended-upgrades;jnv.unattended-upgrades,v1.2.0;v1.2.0"
  "munin;geerlingguy.munin,1.1.2;v1.1.2"
  "munin-node;geerlingguy.munin-node,1.2.0;v1.2.0"
  "upstart;telusdigital.upstart;v1.0.0"
  "logrotate;telusdigital.logrotate;v1.0.0"
  "rsyslog;tersmitten.rsyslog,v3.0.1;v3.0.1"
  "fqdn;holms.fqdn;v1.0.0"
  "znc;triplepoint.znc,1.0.4;v1.0.4"
  "nginx;jdauphant.nginx,v2.0.1;v2.0.1"
  "prometheus;williamyeh.prometheus,1.3.6;v1.3.6"
  "smokeping;akamine.smokeping;v0.0.1"
  "jenkins;geerlingguy.jenkins,1.3.0;v1.3.0"
)

for role in "${roles[@]}"; do
  freyRole="$(echo "${role}" |awk -F";" '{print $1}')"
  ansiRoleAndVersion="$(echo "${role}" |awk -F";" '{print $2}')"
  ansiRole="$(echo "${ansiRoleAndVersion}" |awk -F"," '{print $1}')"
  ansiVersion="$(echo "${ansiRoleAndVersion}" |awk -F"," '{print $2}')"
  freyVersion="$(echo "${role}" |awk -F";" '{print $3}')"

  if [ ! -f "${__root}/roles/${freyRole}/${freyVersion}/README.md" ]; then
    ansible-galaxy install \
    --force \
    --roles-path "${__root}/roles/${freyRole}/${freyVersion}" \
    ${ansiRoleAndVersion}
    shopt -s dotglob nullglob # to also glob over hidden files
    mv "${__root}/roles/${freyRole}/${freyVersion}/${ansiRole}/"* "${__root}/roles/${freyRole}/${freyVersion}/"
    rmdir "${__root}/roles/${freyRole}/${freyVersion}/${ansiRole}/"
  fi

  licenseFile="$(find "${__root}/roles/${freyRole}/${freyVersion}" -name 'LICENSE*')"
  if [ ! -f "${licenseFile}" ]; then
    echo "WARNING! No LICENSE found in ${__root}/roles/${freyRole}/${freyVersion}"
  else
    author=$(echo $(cat "${licenseFile}" |grep Copyright |tail -n1))

    echo "${licenseFile}"

    cp "${licenseFile}" "${__root}/licenses/${ansiRole}-LICENSE"

    if ! egrep "^- ${ansiRole}" "${__root}/licenses/index.md" 2>&1 > /dev/null; then
      echo "- ${ansiRole} -- ${author}" >> "${__root}/licenses/index.md"
    fi

    sort "${__root}/licenses/index.md" -o "${__root}/licenses/index.md"
  fi
done
