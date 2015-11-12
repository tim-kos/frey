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

scenarios="${1:-$(ls ${__dir}/scenario/|egrep -v ^prepare$)}"

__sysTmpDir="${TMPDIR:-/tmp}"
__sysTmpDir="${__sysTmpDir%/}" # <-- remove trailing slash on macosx
__freyTmpDir="${__sysTmpDir}/frey"
mkdir -p "${__freyTmpDir}"

if [[ "${OSTYPE}" == "darwin"* ]]; then
  cmdSed=gsed
else
  cmdSed=sed
fi

if [[ "${OSTYPE}" == "darwin"* ]]; then
  cmdTimeout="gtimeout --kill-after=6m 5m"
else
  cmdTimeout="timeout --kill-after=6m 5m"
fi

__coffee="$(which coffee)"

__os="linux"
if [[ "${OSTYPE}" == "darwin"* ]]; then
  __os="darwin"
fi
__arch="amd64"


if ! which "${cmdSed}" > /dev/null; then
  echo "Please install ${cmdSed}"
  exit 1
fi

# Running prepare before other scenarios is important on Travis,
# so that stdio can diverge - and we can enforce stricter
# stdio comparison on all other tests.
for scenario in $(echo prepare ${scenarios}); do
  echo "==> Scenario: ${scenario}"
  pushd "${__dir}/scenario/${scenario}" > /dev/null

    # Run scenario
    (${cmdTimeout} bash ./run.sh \
      > "${__freyTmpDir}/${scenario}.stdio" 2>&1; \
      echo "${?}" > "${__freyTmpDir}/${scenario}.exitcode" \
    ) || true

    # Clear out environmental specifics
    for typ in $(echo stdio exitcode); do
      curFile="${__freyTmpDir}/${scenario}.${typ}"
      "${cmdSed}" -i \
        -e "s@${__coffee}@{coffee}@g" "${curFile}" \
        -e "s@${__root}@{root}@g" "${curFile}" \
        -e "s@{root}/node_modules/\.bin/coffee@{coffee}@g" "${curFile}" \
        -e "s@{home}/build/kvz/fre{coffee}@{coffee}@g" "${curFile}" \
        -e "s@${HOME:-/home/travis}@{home}@g" "${curFile}" \
        -e "s@${USER:-travis}@{user}@g" "${curFile}" \
        -e "s@${__sysTmpDir}@{tmpdir}@g" "${curFile}" \
        -e "s@${HOSTNAME}@{hostname}@g" "${curFile}" \
        -e "s@${__os}@{os}@g" "${curFile}" \
        -e "s@${__arch}@{arch}@g" "${curFile}" \
        -e "s@OSX@{os}@g" "${curFile}" \
        -e "s@Linux@{os}@g" "${curFile}" \
      || false

      if [ "$(cat "${curFile}" |grep 'FREY:STDIO_REPLACE_IPS' |wc -l)" -gt 0 ]; then
        "${cmdSed}" -i \
          -r 's@[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}@{ip}@g' \
        "${curFile}"
      fi
      if [ "$(cat "${curFile}" |grep 'FREY:STDIO_REPLACE_UUIDS' |wc -l)" -gt 0 ]; then
        "${cmdSed}" -i \
          -r 's@[0-9a-f\-]{32,40}@{uuid}@g' \
        "${curFile}"
      fi
      if [ "$(cat "${curFile}" |grep 'FREY:STDIO_REPLACE_REMOTE_EXEC' |wc -l)" -gt 0 ]; then
        egrep -v 'remote-exec): [ a-zA-Z]' "${curFile}" > "${__sysTmpDir}/frey-filtered.txt"
        mv "${__sysTmpDir}/frey-filtered.txt" "${curFile}"
      fi
    done

    # Save these as new fixtures?
    if [ "${SAVE_FIXTURES:-}" = "true" ]; then
      for typ in $(echo stdio exitcode); do
        curFile="${__freyTmpDir}/${scenario}.${typ}"
        cp -f \
          "${curFile}" \
          "${__dir}/fixture/${scenario}.${typ}"
      done
    fi

    # Compare
    for typ in $(echo stdio exitcode); do
      curFile="${__freyTmpDir}/${scenario}.${typ}"

      echo -n "    comparing ${typ}.. "

      if [ "${typ}" = "stdio" ]; then
        if [ "$(cat "${curFile}" |grep 'FREY:STDIO_SKIP_COMPARE' |wc -l)" -gt 0 ]; then
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
        cat "${__freyTmpDir}/${scenario}.stdio";
        exit 1; \
      )

      echo "✓"
    done

  popd "${__dir}/scenario/${scenario}" > /dev/null
done
