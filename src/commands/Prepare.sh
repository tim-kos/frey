false

DEPLOY_ENV="development"
TSD_HOSTNAME="mpb"
if [ -z "${DEPLOY_ENV}" ]; then
  echo "Environment ${DEPLOY_ENV} not recognized. "
  echo "Please first source envs/development/config.sh or source envs/production/config.sh"
  exit 1
fi

# Set magic variables for current FILE & DIR
__dir="$(pwd)"
__file="${__dir}/$(basename "${BASH_SOURCE[0]}")"
__base="$(basename ${__file} .sh)"

__os="linux"
if [[ "${OSTYPE}" == "darwin"* ]]; then
  __os="darwin"
fi
__arch="amd64"

__ansibleVersion="1.9.2"
__terraformVersion="0.6.3"
__terraformInventoryVersion="0.5"

__rootDir="${__dir}"
__binDir="${__rootDir}/bin"
__terraformDir="${__binDir}/terraform"
__envDir="${__rootDir}/envs/${DEPLOY_ENV}"
__playbookDir="${__rootDir}/playbook"
__terraformExe="${__terraformDir}/terraform"
__terraformInventoryExe="${__binDir}/terraform-inventory-${__terraformInventoryVersion}-${__os}-${__arch}"
__ansibleExe="ansible"
__ansiblePlaybookExe="ansible-playbook"
__ansibleCfg="${__rootDir}/ansible.cfg"

__planFile="${__envDir}/terraform.plan"
__stateFile="${__envDir}/terraform.tfstate"
__playbookFile="${__playbookDir}/main.yml"




### Functions
####################################################################################

function syncUp() {
  [ -z "${host:-}" ] && host="$(${__terraformExe} output public_address)"
  chmod 600 "${TSD_SSH_KEYPUB_FILE}"
  chmod 600 "${TSD_SSH_KEY_FILE}"
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
    -i \"${TSD_SSH_KEY_FILE}\" \
    -l ${TSD_SSH_USER} \
    -o CheckHostIP=no \
    -o UserKnownHostsFile=/dev/null \
    -o StrictHostKeyChecking=no" \
   ${@:2} \
  ${host}:${1}
}

function syncDown() {
  [ -z "${host:-}" ] && host="$(${__terraformExe} output public_address)"
  chmod 600 "${TSD_SSH_KEYPUB_FILE}"
  chmod 600 "${TSD_SSH_KEY_FILE}"
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
    -i \"${TSD_SSH_KEY_FILE}\" \
    -l ${TSD_SSH_USER} \
    -o CheckHostIP=no \
    -o UserKnownHostsFile=/dev/null \
    -o StrictHostKeyChecking=no" \
  ${host}:${1} \
  ${2}
}

function remote() {
  [ -z "${host:-}" ] && host="$(${__terraformExe} output public_address)"
  chmod 600 "${TSD_SSH_KEYPUB_FILE}"
  chmod 600 "${TSD_SSH_KEY_FILE}"
  ssh ${host} \
    -i "${TSD_SSH_KEY_FILE}" \
    -l ${TSD_SSH_USER} \
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

dryRun="${TSD_DRY_RUN:-0}"
step="${1:-prepare}"
afterone="${2:-}"
enabled=0


# Install brew/wget on OSX
if [ "${__os}" = "darwin" ]; then
  [ -z "$(which brew 2>/dev/null)" ] && ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
  [ -z "$(which wget 2>/dev/null)" ] && brew install wget
fi

# Install Ansible
if [ "$(echo $("${__ansibleExe}" --version |head -n1))" != "ansible 1.9.2" ]; then
  echo "--> ${TSD_HOSTNAME} - installing Ansible v${__ansibleVersion}"
  set -x
  sudo easy_install pip
  sudo pip install --upgrade pip
  set +x
  if [ "${__os}" = "darwin" ]; then
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
  echo "--> ${TSD_HOSTNAME} - installing Terraform v{__terraformVersion}"
    zipFile="terraform_${__terraformVersion}_${__os}_${__arch}.zip"
    url="https://dl.bintray.com/mitchellh/terraform/${zipFile}"
    rm -f "${zipFile}" || true
    wget "${url}"
    unzip -o "${zipFile}"
    rm -f "${zipFile}"
  fi
  "${__terraformExe}" version |grep "Terraform v${__terraformVersion}"
popd > /dev/null

# Install SSH Keys
if [ ! -f "${TSD_SSH_KEY_FILE}" ]; then
  echo -e "\n\n" | ssh-keygen -t rsa -C "${TSD_SSH_EMAIL}" -f "${TSD_SSH_KEY_FILE}"
  echo "You may need to add ${TSD_SSH_KEYPUB_FILE} to the Digital Ocean"
  export TSD_SSH_KEYPUB=$(echo "$(cat "${TSD_SSH_KEYPUB_FILE}")") || true
  # Digital ocean requires this:
  export TSD_SSH_KEYPUB_FINGERPRINT="$(ssh-keygen -lf ${TSD_SSH_KEYPUB_FILE} | awk '{print $2}')"
fi
if [ ! -f "${TSD_SSH_KEYPUB_FILE}" ]; then
  chmod 600 "${TSD_SSH_KEY_FILE}" || true
  ssh-keygen -yf "${TSD_SSH_KEY_FILE}" > "${TSD_SSH_KEYPUB_FILE}"
  chmod 600 "${TSD_SSH_KEYPUB_FILE}" || true
fi
