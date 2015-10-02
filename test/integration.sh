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

if [[ "${OSTYPE}" == "darwin"* ]]; then
  cmdSed=gsed
else
  cmdSed=sed
fi

if ! which "${cmdSed}" > /dev/null; then
  echo "Please install ${cmdSed}"
  exit 1
fi

for scenario in $(echo $scenarios); do
  echo "==> Scenario: ${scenario}"
  pushd "${__dir}/scenario/${scenario}" > /dev/null

    # Run scenario
    (bash ./run.sh \
      1> "${tmpDir}/${scenario}.stdout" \
      2> "${tmpDir}/${scenario}.stderr"; \
      echo "${?}" > "${tmpDir}/${scenario}.exitcode" \
    ) || true

    # Clear out environmental specifics
    for typ in $(echo stdout stderr exitcode); do
      "${cmdSed}" -i "s@${__root}@{root}@g" "${tmpDir}/${scenario}.${typ}"
      "${cmdSed}" -i "s@${USER:-travis}@{user}@g" "${tmpDir}/${scenario}.${typ}"
      "${cmdSed}" -i "s@${HOME:-/home/travis}@{home}@g" "${tmpDir}/${scenario}.${typ}"
    done

    # Save these as new fixtures?
    if [ "${SAVE_FIXTURES:-}" = "true" ]; then
      for typ in $(echo stdout stderr exitcode); do
        cp -f \
          "${tmpDir}/${scenario}.${typ}" \
          "${__dir}/fixture/${scenario}.${typ}"
      done
    fi

    # Compare
    for typ in $(echo stdout stderr exitcode); do
      echo -n "    comparing ${typ}.. "
      diff \
        "${__dir}/fixture/${scenario}.${typ}" \
        "${tmpDir}/${scenario}.${typ}"
      echo "✓"
    done

  popd "${__dir}/scenario/${scenario}" > /dev/null
done
