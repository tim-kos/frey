set -x
__ansibleVersion="1.9.2"
__terraformVersion="0.6.3"
__terraformInventoryVersion="0.5"

__terraformDir="${FREY__CONFIG__TOOLS}/terraform"
__terraformExe="${__terraformDir}/terraform"
__terraformInventoryDir="${FREY__CONFIG__ROOT}/bin"
__terraformInventoryExe="${__terraformInventoryDir}/terraform-inventory-${__terraformInventoryVersion}-${FREY__RUNTIME__OS__PLATFORM}-${FREY__RUNTIME__OS__ARCH}"
__ansibleExe="ansible"
__ansiblePlaybookExe="ansible-playbook"
__ansibleCfg="${FREY__CONFIG__DIRECTORY}/ansible.cfg"

__planFile="${FREY__CONFIG__RECIPE}/terraform.plan"
__stateFile="${FREY__CONFIG__RECIPE}/terraform.tfstate"
__playbookFile="${FREY__CONFIG__RECIPE}/main.yml"


__ssh_key_name="${FREY__CONFIG__APP}"
__ssh_user="ubuntu"
__ssh_email="hello@${FREY__CONFIG__APP}"
__ssh_key_file="${FREY__CONFIG__RECIPE}/${FREY__CONFIG__APP}.pem"
__ssh_keypub_file="${FREY__CONFIG__RECIPE}/${FREY__CONFIG__APP}.pub"
__ssh_keypub=$(echo "$(cat "${__ssh_keypub_file}" 2>/dev/null)") || true
__ssh_keypub_fingerprint="$(ssh-keygen -lf ${__ssh_keypub_file} | awk '{print $2}')"



### Functions
####################################################################################

function syncUp() {
  [ -z "${host:-}" ] && host="$(${__terraformExe} output public_address)"
  chmod 600 "${__ssh_keypub_file}"
  chmod 600 "${__ssh_key_file}"
  rsync \
   --archive \
   --delete \
   --exclude=.git* \
   --exclude=.DS_Store \
   --exclude=node_modules \
   --exclude=terraform.* \
   --itemize-changes \
   --checksum \
   --no-times \
   --no-group \
   --no-motd \
   --no-owner \
   --rsh="ssh \
    -i \"${__ssh_key_file}\" \
    -l ${__ssh_user} \
    -o CheckHostIP=no \
    -o UserKnownHostsFile=/dev/null \
    -o StrictHostKeyChecking=no" \
   ${@:2} \
  ${host}:${1}
}

function syncDown() {
  [ -z "${host:-}" ] && host="$(${__terraformExe} output public_address)"
  chmod 600 "${__ssh_keypub_file}"
  chmod 600 "${__ssh_key_file}"
  rsync \
   --archive \
   --delete \
   --exclude=.git* \
   --exclude=.java* \
   --exclude=.* \
   --exclude=*.log \
   --exclude=*.log.* \
   --exclude=*.txt \
   --exclude=org.jenkinsci.plugins.ghprb.GhprbTrigger.xml \
   --exclude=*.bak \
   --exclude=*.hpi \
   --exclude=node_modules \
   --exclude=.DS_Store \
   --exclude=plugins \
   --exclude=builds \
   --exclude=lastStable \
   --exclude=lastSuccessful \
   --exclude=*secret* \
   --exclude=*identity* \
   --exclude=nextBuildNumber \
   --exclude=userContent \
   --exclude=nodes \
   --exclude=updates \
   --exclude=terraform.* \
   --itemize-changes \
   --checksum \
   --no-times \
   --no-group \
   --no-motd \
   --no-owner \
   --no-perms \
   --rsh="ssh \
    -i \"${__ssh_key_file}\" \
    -l ${__ssh_user} \
    -o CheckHostIP=no \
    -o UserKnownHostsFile=/dev/null \
    -o StrictHostKeyChecking=no" \
  ${host}:${1} \
  ${2}
}

function remote() {
  [ -z "${host:-}" ] && host="$(${__terraformExe} output public_address)"
  chmod 600 "${__ssh_keypub_file}"
  chmod 600 "${__ssh_key_file}"
  ssh ${host} \
    -i "${__ssh_key_file}" \
    -l ${__ssh_user} \
    -o UserKnownHostsFile=/dev/null \
    -o CheckHostIP=no \
    -o StrictHostKeyChecking=no "${@:-}"
}

# Waits on first host, then does the rest in parallel
# This is so that the leader can be setup, and then all the followers can join
function inParallel () {
  cnt=0
  for host in $(${__terraformExe} output public_addresses); do
    let "cnt = cnt + 1"
    if [ "${cnt}" = 1 ]; then
      # wait on leader leader
      ${@}
    else
      ${@} &
    fi
  done

  fail=0
  for job in $(jobs -p); do
    # echo ${job}
    wait ${job} || let "fail = fail + 1"
  done
  if [ "${fail}" -ne 0 ]; then
    exit 1
  fi
}


### Vars
####################################################################################

cmd="${1}"
enabled=0


### Runtime
####################################################################################

pushd "${FREY__CONFIG__RECIPE}" > /dev/null

echo "--> ${FREY__RUNTIME__OS__HOSTNAME} - ${cmd}"

if [ "${cmd}" = "remote" ]; then
  remote ${@:2}
  exit ${?}
fi
if [ "${cmd}" = "facts" ]; then
  ANSIBLE_HOST_KEY_CHECKING=False \
  TF_STATE="${__stateFile}" \
    "${__ansibleExe}" all \
      --user="${__ssh_user}" \
      --private-key="${__ssh_key_file}" \
      --inventory-file="${__terraformInventoryExe}" \
      --module-name=setup \
      --args='filter=ansible_*'

  exit ${?}
fi
if [ "${cmd}" = "backup" ]; then
  # syncDown "/var/lib/mysql" "${FREY__CONFIG__RECIPE}/data/"
  exit ${?}
fi
if [ "${cmd}" = "restore" ]; then
  # remote "sudo /etc/init.d/redis-server stop || true"
  # remote "sudo addgroup ubuntu redis || true"
  # remote "sudo chmod -R g+wr /var/lib/redis"
  # syncUp "/var/lib/redis/dump.rdb" "./data/redis-dump.rdb"
  # remote "sudo chown -R redis.redis /var/lib/redis"
  # remote "sudo /etc/init.d/redis-server start"
  exit ${?}
fi


if [ "${cmd}" = "prepare" ]; then
  # Install brew/curl on OSX
  if [ "${FREY__RUNTIME__OS__PLATFORM}" = "darwin" ]; then
    [ -z "$(which brew 2>/dev/null)" ] && ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
    [ -z "$(which curl 2>/dev/null)" ] && brew install curl
  fi

  # Install Ansible
  if [ "$(echo $("${__ansibleExe}" --version |head -n1))" != "ansible 1.9.2" ]; then
    echo "--> ${FREY__RUNTIME__OS__HOSTNAME} - installing Ansible v${__ansibleVersion}"
    set -x
    sudo easy_install pip
    sudo pip install --upgrade pip
    set +x
    if [ "${FREY__RUNTIME__OS__PLATFORM}" = "darwin" ]; then
      set -x
      sudo env CFLAGS=-Qunused-arguments CPPFLAGS=-Qunused-arguments pip install --upgrade ansible==1.9.2
      set +x
    else
      set -x
      sudo pip install --upgrade ansible=1.9.2
      set +x
    fi
  fi

  # Install Terraform
  mkdir -p "${__terraformDir}"
  pushd "${__terraformDir}" > /dev/null
    if [ "$(echo $("${__terraformExe}" version))" != "Terraform v${__terraformVersion}" ]; then
    echo "--> ${FREY__RUNTIME__OS__HOSTNAME} - installing Terraform v${__terraformVersion}"
      zipFile="terraform_${__terraformVersion}_${FREY__RUNTIME__OS__PLATFORM}_${FREY__RUNTIME__OS__ARCH}.zip"
      url="https://dl.bintray.com/mitchellh/terraform/${zipFile}"
      rm -f "${zipFile}" || true
      echo "Downloading ${url} -> ${zipFile}"
      curl -sSL "${url}" > "${zipFile}"
      unzip -o "${zipFile}"
      rm -f "${zipFile}"
    fi
    "${__terraformExe}" version |grep "Terraform v${__terraformVersion}"
  popd > /dev/null

  # Install SSH Keys
  if [ ! -f "${__ssh_key_file}" ]; then
    echo -e "\n\n" | ssh-keygen -t rsa -b 2048 -C "${__ssh_email}" -f "${__ssh_key_file}"
    echo "You may need to add ${__ssh_keypub_file} to the Digital Ocean"
    export __ssh_keypub=$(echo "$(cat "${__ssh_keypub_file}")") || true
    # Digital ocean requires this:
    export __ssh_keypub_fingerprint="$(ssh-keygen -lf ${__ssh_keypub_file} | awk '{print $2}')"
  fi
  if [ ! -f "${__ssh_keypub_file}" ]; then
    chmod 600 "${__ssh_key_file}" || true
    ssh-keygen -yf "${__ssh_key_file}" > "${__ssh_keypub_file}"
    chmod 600 "${__ssh_keypub_file}" || true
  fi

fi

terraformArgs=""

for var in $(env |awk -F= '{print $1}' |egrep '^[A-Z0-9_]+$'); do
  echo "--> setting ${var}"
  terraformArgs="${terraformArgs} -var ${var}=${!var}"
done

# terraformArgs="${terraformArgs} -var AWS_ACCESS_KEY=${AWS_ACCESS_KEY}"
# terraformArgs="${terraformArgs} -var AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID}"
# terraformArgs="${terraformArgs} -var AWS_ZONE_ID=${AWS_ZONE_ID}"
# terraformArgs="${terraformArgs} -var __ssh_keypub=\"${__ssh_keypub}\""
# terraformArgs="${terraformArgs} -var __ssh_user=${__ssh_user}"
# terraformArgs="${terraformArgs} -var __ssh_key_file=${__ssh_key_file}"
# terraformArgs="${terraformArgs} -var __ssh_key_name=${__ssh_key_name}"

if [ "${cmd}" = "init" ]; then
  # if [ ! -f "${__stateFile}" ]; then
  #   echo "Nothing to refresh yet."
  # else
  bash -c "${__terraformExe} refresh ${terraformArgs}" || true
  # fi
fi

if [ "${cmd}" = "plan" ]; then
  rm -f "${__planFile}"
  bash -c ""${__terraformExe}" plan -refresh=false ${terraformArgs} -out "${__planFile}""
fi

if [ "${cmd}" = "backup" ]; then
  # Save state before possibly destroying machine
fi

if [ "${cmd}" = "launch" ]; then
  if [ -f "${__planFile}" ]; then
    echo "--> Press CTRL+C now if you are unsure! Executing plan in ${FREY_CONFIG_SLEEP}s..."
    sleep ${FREY_CONFIG_SLEEP}
    # exit 1
    "${__terraformExe}" apply "${__planFile}"
    git add "${__stateFile}" || true
    git add "${__stateFile}.backup" || true
    git commit -m "Save infra state" || true
  else
    echo "Skipping, no changes. "
  fi
fi

if [ "${cmd}" = "install" ]; then
  tags=""
  if [ -n "${FREY_CONFIG_TAGS}" ]; then
    tags="--tags="${FREY_CONFIG_TAGS}""
  fi
  ANSIBLE_CONFIG="${__ansibleCfg}" \
  ANSIBLE_HOST_KEY_CHECKING=False \
  TF_STATE="${__stateFile}" \
    "${__ansiblePlaybookExe}" \
      ${tags} \
      --user="${__ssh_user}" \
      --private-key="${__ssh_key_file}" \
      --inventory-file="${__terraformInventoryExe}" \
      --sudo \
    "${__playbookFile}"

  # inParallel "remote" "bash -c \"source ~/playbook/env/config.sh && sudo -E bash ~/playbook/install.sh\""
fi

if [ "${cmd}" = "upload" ]; then
  # Upload/Download app here
fi

if [ "${cmd}" = "setup" ]; then
  # Restart services
fi

if [ "${cmd}" = "show" ]; then
  echo "http://${IHT_MACHINE_FQDN}"
  "${__terraformExe}" output
  # for host in $("${__terraformExe}" output public_addresses); do
  #   echo " - http://${host}"
  # done
fi
popd > /dev/null
