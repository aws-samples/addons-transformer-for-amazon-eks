#!/usr/bin/env bash

set -o errexit
set -o nounset
set -o pipefail

# check prerequisites NVM and AWS credentials
if [ -d "${HOME}/.nvm/.git" ];
then
  echo "nvm installed";
else
  echo "nvm not installed. Install it as instructed here: https://github.com/nvm-sh/nvm#install--update-script";
  exit 1;
fi

# cleanup of previous runs
rm -rf ./node_modules
rm -rf aws-sleek-transformer*gz

# install dependencies
curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3
chmod +x get_helm.sh
./get_helm.sh -v 3.8.1
rm -rf get_helm.sh
NVM_DIR="${HOME}/.nvm" && . "${NVM_DIR}/nvm.sh" && nvm install
npm install

# pack
npm run prepack
npm pack

#install
PCK=$(ls aws-sleek-transformer*gz)
npm install -g $PCK
echo "Installed successfully, test by running: 'aws-sleek-transformer' --help "