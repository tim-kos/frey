#!/usr/bin/env bash
set -o pipefail
set -o errexit
set -o nounset
# set -o xtrace


git config --global user.name "Freybot"
git config --global user.email "bot@freyproject.io"


# because a Travis deploy script has to be a real file
npm run web:install
npm run web:build
npm run web:deploy
