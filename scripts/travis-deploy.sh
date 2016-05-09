#!/usr/bin/env bash
set -o pipefail
set -o errexit
set -o nounset
# set -o xtrace


git config --global user.name "Freybot"
git config --global user.email "bot@freyproject.io"


# because a Travis deploy script has to be a real file
npm run website:install
npm run website:build
npm run website:deploy
