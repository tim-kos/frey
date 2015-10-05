#!/usr/bin/env bash

set -o pipefail
set -o errexit
set -o nounset
# set -o xtrace

# Set magic variables for current FILE & DIR
__dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
__file="${__dir}/$(basename "${BASH_SOURCE[0]}")"
__base="$(basename ${__file} .sh)"
__root="$(cd "$(dirname "${__dir}")" && pwd)"

scenarios="${1:-$(ls ${__dir}/scenario/)}"

tmpDir="${TMPDIR:-/tmp}/frey"
mkdir -p "${tmpDir}"
LC_COLLATE=C

if [[ "${OSTYPE}" == "darwin"* ]]; then
  cmdSed=gsed
  cmdSort=gsort
else
  cmdSed=sed
  cmdSort=sort
fi


os="linux"
if [[ "${OSTYPE}" == "darwin"* ]]; then
  os="darwin"
fi
arch="amd64"


if ! which "${cmdSed}" > /dev/null; then
  echo "Please install ${cmdSed}"
  exit 1
fi

for scenario in $(echo ${scenarios} |"${cmdSort}"); do
  echo "==> Scenario: ${scenario}"
  pushd "${__dir}/scenario/${scenario}" > /dev/null

    # Run scenario
    (bash ./run.sh \
      > "${tmpDir}/${scenario}.stdio" 2>&1; \
      echo "${?}" > "${tmpDir}/${scenario}.exitcode" \
    ) || true

    # Clear out environmental specifics
    for typ in $(echo stdio exitcode); do
      curFile="${tmpDir}/${scenario}.${typ}"
      "${cmdSed}" -i "s@${__root}@{root}@g" "${curFile}"
      "${cmdSed}" -i "s@${HOME:-/home/travis}@{home}@g" "${curFile}"
      "${cmdSed}" -i "s@${USER:-travis}@{user}@g" "${curFile}"
      "${cmdSed}" -i "s@${HOSTNAME}@{hostname}@g" "${curFile}"
      "${cmdSed}" -i "s@${os}@{os}@g" "${curFile}"
      "${cmdSed}" -i "s@${arch}@{arch}@g" "${curFile}"
    done

    # Save these as new fixtures?
    if [ "${SAVE_FIXTURES:-}" = "true" ]; then
      for typ in $(echo stdio exitcode); do
        curFile="${tmpDir}/${scenario}.${typ}"
        cp -f \
          "${curFile}" \
          "${__dir}/fixture/${scenario}.${typ}"
      done
    fi

    # Compare
    for typ in $(echo stdio exitcode); do
      curFile="${tmpDir}/${scenario}.${typ}"

      echo -n "    comparing ${typ}.. "

      if [ "${typ}" = "stdio" ]; then
        if [ "$(cat "${curFile}" |grep 'FREY:SKIP_COMPARE_STDIO' |wc -l)" -gt 0 ]; then
          echo "skip"
          continue
        fi
      fi

      diff \
        --strip-trailing-cr \
        "${__dir}/fixture/${scenario}.${typ}" \
        "${curFile}" || ( \
        echo -e "\n\n==> MISMATCH OF: ${typ}";
        echo -e "\n\n==> EXPECTED STDIO: ";
        cat "${__dir}/fixture/${scenario}.stdio";
        echo -e "\n\n==> ACTUAL STDIO: ";
        cat "${tmpDir}/${scenario}.stdio";
        exit 1; \
      )

      echo "✓"
    done

  popd "${__dir}/scenario/${scenario}" > /dev/null
done
