__ansibleVersion="1.9.2"
__terraformVersion="0.6.3"
__terraformInventoryVersion="0.5"

__rootDir="${FREY__DIRECTORY}"
__terraformDir="${FREY__TOOLS}/terraform"
__terraformExe="${__terraformDir}/terraform"
__terraformInventoryExe="${FREY__TOOLS}/terraform-inventory-${__terraformInventoryVersion}-${FREY__PREPARE__OS_PLATFORM}-${FREY__PREPARE__OS_ARCH}"
__ansibleExe="ansible"
__ansiblePlaybookExe="ansible-playbook"
__ansibleCfg="${__rootDir}/ansible.cfg"

__planFile="${FREY__RECIPE}/terraform.plan"
__stateFile="${FREY__RECIPE}/terraform.tfstate"
__playbookFile="${FREY__RECIPE}/main.yml"




### Functions
####################################################################################

function syncUp() {
  [ -z "${host:-}" ] && host="$(${__terraformExe} output public_address)"
  chmod 600 "${IHT_SSH_KEYPUB_FILE}"
  chmod 600 "${IHT_SSH_KEY_FILE}"
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
    -i \"${IHT_SSH_KEY_FILE}\" \
    -l ${IHT_SSH_USER} \
    -o CheckHostIP=no \
    -o UserKnownHostsFile=/dev/null \
    -o StrictHostKeyChecking=no" \
   ${@:2} \
  ${host}:${1}
}

function syncDown() {
  [ -z "${host:-}" ] && host="$(${__terraformExe} output public_address)"
  chmod 600 "${IHT_SSH_KEYPUB_FILE}"
  chmod 600 "${IHT_SSH_KEY_FILE}"
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
    -i \"${IHT_SSH_KEY_FILE}\" \
    -l ${IHT_SSH_USER} \
    -o CheckHostIP=no \
    -o UserKnownHostsFile=/dev/null \
    -o StrictHostKeyChecking=no" \
  ${host}:${1} \
  ${2}
}

function remote() {
  [ -z "${host:-}" ] && host="$(${__terraformExe} output public_address)"
  chmod 600 "${IHT_SSH_KEYPUB_FILE}"
  chmod 600 "${IHT_SSH_KEY_FILE}"
  ssh ${host} \
    -i "${IHT_SSH_KEY_FILE}" \
    -l ${IHT_SSH_USER} \
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

dryRun="${IHT_DRY_RUN:-0}"
step="${1:-prepare}"
afterone="${2:-}"
enabled=0


### Runtime
####################################################################################

pushd "${FREY__RECIPE}" > /dev/null

if [ "${step}" = "remote" ]; then
  remote ${@:2}
  exit ${?}
fi
if [ "${step}" = "facts" ]; then
  ANSIBLE_HOST_KEY_CHECKING=False \
  TF_STATE="${__stateFile}" \
    "${__ansibleExe}" all \
      --user="${IHT_SSH_USER}" \
      --private-key="${IHT_SSH_KEY_FILE}" \
      --inventory-file="${__terraformInventoryExe}" \
      --module-name=setup \
      --args='filter=ansible_*'

  exit ${?}
fi
if [ "${step}" = "backup" ]; then
  # syncDown "/var/lib/mysql" "${__rootDir}/data/"
  exit ${?}
fi
if [ "${step}" = "restore" ]; then
  # remote "sudo /etc/init.d/redis-server stop || true"
  # remote "sudo addgroup ubuntu redis || true"
  # remote "sudo chmod -R g+wr /var/lib/redis"
  # syncUp "/var/lib/redis/dump.rdb" "./data/redis-dump.rdb"
  # remote "sudo chown -R redis.redis /var/lib/redis"
  # remote "sudo /etc/init.d/redis-server start"
  exit ${?}
fi

processed=""
for action in "prepare" "init" "plan" "backup" "launch" "install" "upload" "setup" "show"; do
  [ "${action}" = "${step}" ] && enabled=1
  [ "${enabled}" -eq 0 ] && continue
  if [ -n "${processed}" ] && [ "${afterone}" = "done" ]; then
    break
  fi

  echo "--> ${IHT_HOSTNAME} - ${action}"

  if [ "${action}" = "prepare" ]; then
    # Install brew/wget on OSX
    if [ "${FREY__PREPARE__OS_PLATFORM}" = "darwin" ]; then
      [ -z "$(which brew 2>/dev/null)" ] && ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
      [ -z "$(which wget 2>/dev/null)" ] && brew install wget
    fi

    # Install Ansible
    if [ "$(echo $("${__ansibleExe}" --version |head -n1))" != "ansible 1.9.2" ]; then
      echo "--> ${IIM_HOSTNAME} - installing Ansible v${__ansibleVersion}"
      set -x
      sudo easy_install pip
      sudo pip install --upgrade pip
      set +x
      if [ "${FREY__PREPARE__OS_PLATFORM}" = "darwin" ]; then
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
      echo "--> ${IHT_HOSTNAME} - installing Terraform v{__terraformVersion}"
        zipFile="terraform_${__terraformVersion}_${FREY__PREPARE__OS_PLATFORM}_${FREY__PREPARE__OS_ARCH}.zip"
        url="https://dl.bintray.com/mitchellh/terraform/${zipFile}"
        rm -f "${zipFile}" || true
        wget "${url}"
        unzip -o "${zipFile}"
        rm -f "${zipFile}"
      fi
      "${__terraformExe}" version |grep "Terraform v${__terraformVersion}"
    popd > /dev/null

    # Install SSH Keys
    if [ ! -f "${IHT_SSH_KEY_FILE}" ]; then
      echo -e "\n\n" | ssh-keygen -t rsa -C "${IHT_SSH_EMAIL}" -f "${IHT_SSH_KEY_FILE}"
      echo "You may need to add ${IHT_SSH_KEYPUB_FILE} to the Digital Ocean"
      export IHT_SSH_KEYPUB=$(echo "$(cat "${IHT_SSH_KEYPUB_FILE}")") || true
      # Digital ocean requires this:
      export IHT_SSH_KEYPUB_FINGERPRINT="$(ssh-keygen -lf ${IHT_SSH_KEYPUB_FILE} | awk '{print $2}')"
    fi
    if [ ! -f "${IHT_SSH_KEYPUB_FILE}" ]; then
      chmod 600 "${IHT_SSH_KEY_FILE}" || true
      ssh-keygen -yf "${IHT_SSH_KEY_FILE}" > "${IHT_SSH_KEYPUB_FILE}"
      chmod 600 "${IHT_SSH_KEYPUB_FILE}" || true
    fi

    processed="${processed} ${action}" && continue
  fi

  terraformArgs=""
  terraformArgs="${terraformArgs} -var IHT_AWS_SECRET_KEY=${IHT_AWS_SECRET_KEY}"
  terraformArgs="${terraformArgs} -var IHT_AWS_ACCESS_KEY=${IHT_AWS_ACCESS_KEY}"
  terraformArgs="${terraformArgs} -var IHT_AWS_ACCOUNT_ID=${IHT_AWS_ACCOUNT_ID}"
  terraformArgs="${terraformArgs} -var IHT_AWS_ZONE_ID=${IHT_AWS_ZONE_ID}"
  terraformArgs="${terraformArgs} -var IHT_APP_FQDN=${IHT_APP_FQDN}"
  terraformArgs="${terraformArgs} -var IHT_MACHINE_FQDN=${IHT_MACHINE_FQDN}"
  terraformArgs="${terraformArgs} -var IHT_SSH_KEYPUB=\"${IHT_SSH_KEYPUB}\""
  terraformArgs="${terraformArgs} -var IHT_SSH_USER=${IHT_SSH_USER}"
  terraformArgs="${terraformArgs} -var IHT_SSH_KEY_FILE=${IHT_SSH_KEY_FILE}"
  terraformArgs="${terraformArgs} -var IHT_SSH_KEY_NAME=${IHT_SSH_KEY_NAME}"

  if [ "${action}" = "init" ]; then
    # if [ ! -f "${__stateFile}" ]; then
    #   echo "Nothing to refresh yet."
    # else
    bash -c "${__terraformExe} refresh ${terraformArgs}" || true
    # fi
  fi

  if [ "${action}" = "plan" ]; then
    rm -f "${__planFile}"
    bash -c ""${__terraformExe}" plan -refresh=false ${terraformArgs} -out "${__planFile}""
    processed="${processed} ${action}" && continue
  fi

  if [ "${action}" = "backup" ]; then
    # Save state before possibly destroying machine
    processed="${processed} ${action}" && continue
  fi

  if [ "${action}" = "launch" ]; then
    if [ -f "${__planFile}" ]; then
      echo "--> Press CTRL+C now if you are unsure! Executing plan in ${IHT_VERIFY_TIMEOUT}s..."
      [ "${dryRun}" -eq 1 ] && echo "--> Dry run break" && exit 1
      sleep ${IHT_VERIFY_TIMEOUT}
      # exit 1
      "${__terraformExe}" apply "${__planFile}"
      git add "${__stateFile}" || true
      git add "${__stateFile}.backup" || true
      git commit -m "Save infra state" || true
    else
      echo "Skipping, no changes. "
    fi
    processed="${processed} ${action}" && continue
  fi

  if [ "${action}" = "install" ]; then
    tags=""
    if [ -n "${IIM_ANSIBLE_TAGS}" ]; then
      tags="--tags="${IIM_ANSIBLE_TAGS}""
    fi
    ANSIBLE_CONFIG="${__ansibleCfg}" \
    ANSIBLE_HOST_KEY_CHECKING=False \
    TF_STATE="${__stateFile}" \
      "${__ansiblePlaybookExe}" \
        ${tags} \
        --user="${IIM_SSH_USER}" \
        --private-key="${IIM_SSH_KEY_FILE}" \
        --inventory-file="${__terraformInventoryExe}" \
        --sudo \
      "${__playbookFile}"

    # inParallel "remote" "bash -c \"source ~/playbook/env/config.sh && sudo -E bash ~/playbook/install.sh\""
    processed="${processed} ${action}" && continue
  fi

  if [ "${action}" = "upload" ]; then
    # Upload/Download app here
    processed="${processed} ${action}" && continue
  fi

  if [ "${action}" = "setup" ]; then
    # Restart services
    processed="${processed} ${action}" && continue
  fi

  if [ "${action}" = "show" ]; then
    echo "http://${IIM_MACHINE_FQDN}:${IIM_APP_PORT}"
    # for host in $("${__terraformExe}" output public_addresses); do
    #   echo " - http://${host}:${IIM_APP_PORT}"
    # done
    processed="${processed} ${action}" && continue
  fi
done
popd > /dev/null

echo "--> ${IHT_HOSTNAME} - completed:${processed} : )"
