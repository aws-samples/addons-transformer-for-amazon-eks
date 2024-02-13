SHELL=bash
HELM_VERSION="3.8.1"
default: pack

check:
	if [ -d "${HOME}/.nvm/.git" ]; then echo "nvm installed"; else echo "nvm not installed. Install it as instructed here: https://github.com/nvm-sh/nvm#install--update-script"; exit 1; fi

scrub:
	rm -rf ./node_modules
	rm -rf aws-sleek-transformer*gz

setup:
	curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3
	chmod +x get_helm.sh
	./get_helm.sh -v 3.8.1
	rm -rf get_helm.sh
	NVM_DIR="$(HOME)/.nvm" && . "$(NVM_DIR)/nvm.sh" && nvm install
	npm install

build:
	npm run prepack
	npm pack

install:
	npm install -g $(shell ls aws-sleek-transformer*gz)
	echo "Installed successfully, test by running: 'aws-sleek-transformer' --help "

pack: check scrub setup build install