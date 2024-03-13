#!/usr/bin/env bash

# check prerequisites: AWS
AWS_CHECK=$(aws sts get-caller-identity > /dev/null ;echo $?)
if [ $AWS_CHECK -eq 0 ];
then
  echo "AWS access confirmed."
else
  echo "No AWS access. Install and set up access as instructed here: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
  exit 1;
fi

# check prerequisites: NVM
if [ -d "$NVM_DIR/.git" ];
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
HELM_VERSION="v3.8.1"
curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3
chmod +x get_helm.sh
./get_helm.sh -v $HELM_VERSION
rm -rf get_helm.sh

. $NVM_DIR/nvm.sh
nvm install
npm install

# pack
npm run prepack
npm pack

#install
PCK=$(ls aws-sleek-transformer*gz)
npm install -g $PCK
echo "Installed successfully, test by running: 'aws-sleek-transformer' --help "