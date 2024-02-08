Addons Transformer CLI for Amazon EKS
=====================================

<!-- toc -->
* [Introduction](#introduction)
* [Pre-requisites](#pre-requisites)
* [Features](#features)
* [Installation](#installation)
* [Commands](#commands)
<!-- tocstop -->

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

## Features
This npm module does the following features:

### Helm chart validation
It grabs the following form the command line parameters or an input file the chart URL, pull it and performs static 
validations to find occurrences of:
 - `.Capabilities`
 - `helm.sh/hook`
 - Use of `.Release.Service` (TODO)
 - Dependencies external to the main chart

If the chart is not in a public registry, login on it in advance is necessary, for example, for login on ECR:

```shell
export AWS_ACCOUNT=<Registry account> 
export AWS_REGION=<Registry region>
export CHART_NAME=<Helm chart name>
export ECR_HELM_REPOSITORY=${AWS_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/${CHART_NAME}
aws ecr get-login-password --region  eu-west-1 | helm registry login --username AWS --password-stdin ${ECR_HELM_REPOSITORY%%/*}
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
* [Validate](#validate)
* [Create-issue`](#create-issue)

### validate

Validates the addon after pulling it from the helm repository.

`aws-sleek-transformer validate [HELMURL]`

```
USAGE
  $ aws-sleek-transformer validate [HELMURL] [-r <value> | [-f <value> | --helmUrl <value>] | ] [-p <value> | 
    | ] [-v <value> | ] [--addonName <value>] [--skipHooks]

ARGUMENTS
  HELMURL  Fully qualified Helm URL of the addon

FLAGS
  -f, --file=<value>       Path to add-on input file
  -p, --protocol=<value>   Protocol of the helm hosting to use
  -r, --helmRepo=<value>   Helm repo of the addon
  -v, --version=<value>    Version of the addon to validate
      --addonName=<value>  Name of the addon
      --helmUrl=<value>    Fully qualified URL of the Repo
      --skipHooks          Skip helm hooks validation

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
  $ aws-sleek-transformer validate
```

_See code: [src/commands/validate.ts](https://github.com/aws-samples/addons-transformer-for-amazon-eks/blob/v0.0.1/src/commands/validate.ts)_
<!-- commandsstop -->

### create-issue

`aws-sleek-transformer create-issue FILE`

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

  TODO:
  * Run validation before creating the issue


EXAMPLES
  $ aws-sleek-transformer create-issue filename
```

_See code: [src/commands/create-issue.ts](https://github.com/aws-samples/addons-transformer-for-amazon-eks/blob/v0.0.1/src/commands/create-issue.ts)_
