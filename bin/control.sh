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


### Functions
####################################################################################

function syncUp() {
  [ -z "${host:-}" ] && host="$(${__terraformExe} output public_address)"
  chmod 600 "${FREY__RUNTIME__SSH__KEYPUB_FILE}"
  chmod 600 "${FREY__RUNTIME__SSH__KEYPRV_FILE}"
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
    -i \"${FREY__RUNTIME__SSH__KEYPRV_FILE}\" \
    -l ${FREY__RUNTIME__SSH__USER} \
    -o CheckHostIP=no \
    -o UserKnownHostsFile=/dev/null \
    -o StrictHostKeyChecking=no" \
   ${@:2} \
  ${host}:${1}
}

function syncDown() {
  [ -z "${host:-}" ] && host="$(${__terraformExe} output public_address)"
  chmod 600 "${FREY__RUNTIME__SSH__KEYPUB_FILE}"
  chmod 600 "${FREY__RUNTIME__SSH__KEYPRV_FILE}"
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
    -i \"${FREY__RUNTIME__SSH__KEYPRV_FILE}\" \
    -l ${FREY__RUNTIME__SSH__USER} \
    -o CheckHostIP=no \
    -o UserKnownHostsFile=/dev/null \
    -o StrictHostKeyChecking=no" \
  ${host}:${1} \
  ${2}
}

function remote() {
  [ -z "${host:-}" ] && host="$(${__terraformExe} output public_address)"
  chmod 600 "${FREY__RUNTIME__SSH__KEYPUB_FILE}"
  chmod 600 "${FREY__RUNTIME__SSH__KEYPRV_FILE}"
  ssh ${host} \
    -i "${FREY__RUNTIME__SSH__KEYPRV_FILE}" \
    -l ${FREY__RUNTIME__SSH__USER} \
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

if [ "${cmd}" = "remote" ]; then
  remote ${@:2}
  exit ${?}
fi
if [ "${cmd}" = "facts" ]; then
  ANSIBLE_HOST_KEY_CHECKING=False \
  TF_STATE="${__stateFile}" \
    "${__ansibleExe}" all \
      --user="${FREY__RUNTIME__SSH__USER}" \
      --private-key="${FREY__RUNTIME__SSH__KEYPRV_FILE}" \
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
    if [ "$(echo $("${__terraformExe}" version) 2>/dev/null)" != "Terraform v${__terraformVersion}" ]; then
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
  if [ ! -f "${FREY__RUNTIME__SSH__KEYPRV_FILE}" ]; then
    echo -e "\n\n" | ssh-keygen -t rsa -b 2048 -C "${FREY__RUNTIME__SSH__EMAIL}" -f "${FREY__RUNTIME__SSH__KEYPRV_FILE}"
    echo "You may need to add ${FREY__RUNTIME__SSH__KEYPUB_FILE} to the Digital Ocean"
    export FREY__RUNTIME__SSH__KEYPUB_BODY=$(echo "$(cat "${FREY__RUNTIME__SSH__KEYPUB_FILE}")") || true
    # Digital ocean requires this:
    export FREY__RUNTIME__SSH__KEYPUB_FINGERPRINT="$(ssh-keygen -lf ${FREY__RUNTIME__SSH__KEYPUB_FILE} | awk '{print $2}')"
  fi
  if [ ! -f "${FREY__RUNTIME__SSH__KEYPUB_FILE}" ]; then
    chmod 600 "${FREY__RUNTIME__SSH__KEYPRV_FILE}" || true
    ssh-keygen -yf "${FREY__RUNTIME__SSH__KEYPRV_FILE}" > "${FREY__RUNTIME__SSH__KEYPUB_FILE}"
    chmod 600 "${FREY__RUNTIME__SSH__KEYPUB_FILE}" || true
  fi

fi

terraformArgs=""
# We can't just pass all ENV vars to Terraform. It will crash on e.g. RESET.
for var in $(env |awk -F= '{print $1}' |egrep '^(FREY|AWS|TSD)[A-Z0-9_]+$'); do
  # echo "--> setting ${var}"
  terraformArgs="${terraformArgs} -var ${var}=${!var}"
done

if [ "${cmd}" = "init" ]; then
  true
fi

pushd "${FREY__CONFIG__RECIPE}" > /dev/null

if [ "${cmd}" = "refresh" ]; then
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
  true
fi

if [ "${cmd}" = "launch" ]; then
  if [ -f "${__planFile}" ]; then
    echo "--> Press CTRL+C now if you are unsure! Executing plan in ${FREY__CONFIG__SLEEP}s..."
    sleep ${FREY__CONFIG__SLEEP}
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
  if [ -n "${FREY__CONFIG__TAGS}" ]; then
    tags="--tags="${FREY__CONFIG__TAGS}""
  fi
  ANSIBLE_CONFIG="${__ansibleCfg}" \
  ANSIBLE_HOST_KEY_CHECKING=False \
  TF_STATE="${__stateFile}" \
    "${__ansiblePlaybookExe}" \
      ${tags} \
      --user="${FREY__RUNTIME__SSH__USER}" \
      --private-key="${FREY__RUNTIME__SSH__KEYPRV_FILE}" \
      --inventory-file="${__terraformInventoryExe}" \
      --sudo \
    "${__playbookFile}"

  # inParallel "remote" "bash -c \"source ~/recipe/env/config.sh && sudo -E bash ~/recipe/install.sh\""
fi

if [ "${cmd}" = "upload" ]; then
  # Upload/Download app here
  true
fi

if [ "${cmd}" = "setup" ]; then
  # Restart services
  true
fi

if [ "${cmd}" = "show" ]; then
  true
  # "${__terraformExe}" output
  # for host in $("${__terraformExe}" output public_addresses); do
  #   echo " - http://${host}"
  # done
fi
popd > /dev/null
