#!/usr/bin/env bash
set -o pipefail
set -o errexit
set -o nounset
# set -o xtrace


git config --global user.name "Freybot"
git config --global user.email "bot@freyproject.io"

# required for middleman
# We need a loging shell
# (http://stackoverflow.com/questions/9336596/rvm-installation-not-working-rvm-is-not-a-function)
/bin/bash --login -c ' \
export PATH="$PATH:$HOME/.rvm/bin" && \
rvm install 2.2.2 && \
rvm --default use 2.2.2 && \
npm run website:install && \
npm run website:build && \
npm run website:deploy && \
true'
