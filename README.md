Addons Transformer CLI for Amazon EKS
=====================================

* [Introduction](#introduction)
* [Pre-requisites](#pre-requisites)
* [Features](#features)
* [Installation](#installation)
* [Commands](#commands)

## Introduction

Sleek Marketplace validator is solution provide pre-launch validations of the partner software on compatibility with 
Sleek guidelines, covering static and dynamic (deployment/runtime) aspects. 

## Pre-requisites
To implement this solution, you need the following prerequisites:

* The [AWS Command Line Interface](http://aws.amazon.com/cli) (AWS CLI) [installed](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html). The AWS CLI is a unified tool to manage your AWS services.
* AWS CLI default profile should be configured to access your AWS Account.
* [Node](https://nodejs.org/en/download/current/) version 18.12.1 or later.
* [NPM](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) version 8.19.2 or later.
* [Helm CLI](https://helm.sh/docs/intro/install/) to interact with helm charts.

## Quick-install

You can run `make` or execute `install.sh` to build this project and install the resulting library. In this case only the following are required:

* The [AWS Command Line Interface](http://aws.amazon.com/cli) (AWS CLI) [installed](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html). The AWS CLI is a unified tool to manage your AWS services. 
* [NVM](https://github.com/nvm-sh/nvm#install--update-script)

Both of these install the suitable Node, Npm and Helm versions required.

## Cloud Shell Installation
To quickly get started with this transformer, you can leverage CloudShell in the AWS Console. Some prerequisites you need:
* Access to the helm chart to pull it
* Install the Helm CLI in CloudShell using the following commands:
    ```shell
    $ curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3
    $ chmod 700 get_helm.sh
    $ ./get_helm.sh
    ```
* A github token as required by [The Github Service](README.md#request-submission-for-onboarding-the-add-on-to-the-program)

To use this CLI in CloudShell,
* Log into the AWS Console with a role that has access to the location of the helm chart
    * If the chart is in a private ECR repo, ensure the role can pull from that repo.
    * If the chart is in a public repo, ensure that there aren't any permissions restricting access to the public domain
* Use the npm install command to directly install the CLI into the shell: `npm i -g aws-sleek-transformer`
* Follow steps in [the Helm chart validation section](README.md#helm-chart-validation) for all other questions.

## Features
This npm module does the following features:

### Helm chart validation
It grabs the following form the command line parameters or an input file the chart URL, pull it and performs static 
validations:
 - Finding occurrences of unsupported `.Capabilities`
 - Templates creating `helm.sh/hook`
 - Use of `.Release.Service`
 - Use of helm lookup function
 - Dependencies external to the main chart
 - Errors running `helm lint` see [lint command](#helm-lint-command) below
 - Errors running `helm template...` (see [template command](#helm-template-command) below

If the chart is not in a public registry, login on it in advance is necessary, for example, for login on ECR:

```shell
export AWS_ACCOUNT=<Registry account> 
export AWS_REGION=<Registry region>
export CHART_NAME=<Helm chart name>
export ECR_HELM_REPOSITORY=${AWS_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/${CHART_NAME}
aws ecr get-login-password --region  eu-west-1 | helm registry login --username AWS --password-stdin ${ECR_HELM_REPOSITORY%%/*}
```

#### Helm lint command
```shell
helm lint --strict --with-subcharts $CHART_LOCATION
```


#### Helm template command
```shell
helm template $CHART_NAME $CHART_LOCATION
 --set k8version=$KUBERNETES_VERSION
 --kube-version $KUBERNETES_VERSION
 --namespace $ADDON_NAMESPACE
 --include-crds
 --no-hooks
```

### Request submission for onboarding the add-on to the program

It creates a GitHub issue in the onboarding repository for starting the process. As input, it takes the path to a `yaml`
template that should contain the vendor, product and the add-on required information. The json-schema for its creation
can be found in this repo [schema](./schema/onboarding.schema.json) and an example in the [doc/examples](./doc/examples/onboarding.example.yaml)
directory.

For validation the template, it supports the flag `--dry-run` that prevents the issue creation.

As it will run locally `aws-sleek-transformer validate` passing the file as input, it needs to be able to download the
chart. 

## Installation
<!-- usage -->
```sh-session
$ npm install -g aws-sleek-transformer
$ aws-sleek-transformer COMMAND
running command...
$ aws-sleek-transformer (--version)
aws-sleek-transformer/0.0.1 darwin-arm64 node-v20.10.0
$ aws-sleek-transformer --help [COMMAND]
USAGE
  $ aws-sleek-transformer COMMAND
...
```
<!-- usagestop -->
## Commands
<!-- commands -->
* [`aws-sleek-transformer create-issue FILE`](#aws-sleek-transformer-create-issue-file)
* [`aws-sleek-transformer validate [HELMURL]`](#aws-sleek-transformer-validate-helmurl)

## `aws-sleek-transformer create-issue FILE`

Creates a Github Issue based in the input file

```
USAGE
  $ aws-sleek-transformer create-issue FILE [-d] [--file <value>]

ARGUMENTS
  FILE  Path to add-on input file

FLAGS
  -d, --dryRun        Runs all checks without creating the issue
      --file=<value>  Path to add-on input file

DESCRIPTION
  Creates a Github Issue based in the input file


  This creates a Github Issue on the Sleek repository.

  It will validate the input file to match the schema


EXAMPLES
  $ aws-sleek-transformer create-issue filename
```

_See code: [src/commands/create-issue.ts](https://github.com/aws-samples/addons-transformer-for-amazon-eks/blob/v0.0.1/src/commands/create-issue.ts)_

## `aws-sleek-transformer validate [HELMURL]`

Validates the addon after pulling it from the helm repository.

```
USAGE
  $ aws-sleek-transformer validate [HELMURL] [-d <value> | [-f <value> | --helmUrl <value>] | ] [-r <value> | 
    | ] [-p <value> |  | ] [-v <value> | ] [--addonName <value>] [-n <value>] [--k8sVersions <value>] [--skipHooks]
    [--skipReleaseService]

ARGUMENTS
  HELMURL  Fully qualified Helm URL of the addon

FLAGS
  -d, --directory=<value>       Path to the local addon folder
  -f, --file=<value>            Path to add-on input file
  -n, --addonNamespace=<value>  Add-on namespace
  -p, --protocol=<value>        Protocol of the helm hosting to use
  -r, --helmRepo=<value>        URL of the helm repo containg protocol and repo
  -v, --version=<value>         Version of the addon to validate
      --addonName=<value>       Name of the addon
      --helmUrl=<value>         Fully qualified URL of the Repo including version tag
      --k8sVersions=<value>     Comma separated list of supported kubernetes versions
      --skipHooks               Skip helm hooks validation
      --skipReleaseService      Skip .Release.Service occurrences

DESCRIPTION
  Validates the addon after pulling it from the helm repository.


  This performs pre-launch validations of the partner software on compatibility with Sleek guidelines, covering static
  and dynamic (deployment/runtime) aspects.

  Runs the static analysis to find occurrences of:
  * .Capabilities
  * helm.sh/hook
  * external helm dependencies

  It will perform a static validation on the device and then give you the option to submit it to the marketplace for
  runtime and further validation before it can be included in the EKS Console marketplace.

  The command can accept two different formats of inputs:
  * Fully qualified Helm URL to download
  * Deconstructed URL that requires Protocol, Repo, and Version to pull


EXAMPLES
  $ aws-sleek-transformer validate oci://12345678901.dkr.ecr.us-east-2.amazonaws.com/example-charts:x.x.x

  $ aws-sleek-transformer validate -r 12345678901.dkr.ecr.us-east-2.amazonaws.com/example-charts -p oci -v x.x.x

  $ aws-sleek-transformer validate -f ./input.yaml

  $ aws-sleek-transformer validate -d ./addon-folder

  $ aws-sleek-transformer validate --help
```

_See code: [src/commands/validate.ts](https://github.com/aws-samples/addons-transformer-for-amazon-eks/blob/v0.0.1/src/commands/validate.ts)_
<!-- commandsstop -->
