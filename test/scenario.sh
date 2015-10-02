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

for scenario in $(echo $scenarios); do
  echo "==> Scenario: ${scenario}"
  pushd "${__dir}/scenario/${scenario}" > /dev/null

    (./run.sh \
      1> "${tmpDir}/${scenario}.stdout" \
      2> "${tmpDir}/${scenario}.stderr"; \
      echo "${?}" > "${tmpDir}/${scenario}.exitcode" \
    ) || true

    if [ "${SAVE_FIXTURES:-}" = "true" ]; then
      for typ in $(echo stdout stderr exitcode); do
        cp -f \
          "${tmpDir}/${scenario}.${typ}" \
          "${__dir}/fixture/${scenario}.${typ}"
      done
    fi

    for typ in $(echo stdout stderr exitcode); do
      diff \
        "${tmpDir}/${scenario}.${typ}" \
        "${__dir}/fixture/${scenario}.${typ}"
    done

  popd "${__dir}/scenario/${scenario}" > /dev/null
done
