Addons Transformer CLI for Amazon EKS
=====================================

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->

## Introduction

Sleek Marketplace validator is solution provide pre-launch validations of the partner software on compatibility with Sleek guidelines, covering static and dynamic (deployment/runtime) aspects. This npm module does the following:

1. Installs project dependencies such as `kubectl`, `eksctl`, `helm` utilities to the terminal.
2. Grabs the following user inputs :
    - Addon Name
    - Helm Url of the Addon
    - Addon version
    - Deployment namespace
    - Account id of the marketplace account
    - AWS region
3. Authenticates to ECR Repo and downloads the helm chart from the specified Helm repo url.
4. Performs static validations to find occurrences of:
    - `.Capabilities`
    - `helm.sh/hook`
5. Sends the addon and the report of the validation to the AWS Marketplace team to start getting the addon listed on the
  EKS console marketplace.


### Pre-requisites
To implement this solution, you need the following prerequisites:

* The [AWS Command Line Interface](http://aws.amazon.com/cli) (AWS CLI) [installed](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html). The AWS CLI is a unified tool to manage your AWS services.
* AWS CLI default profile should be configured to access your AWS Account.
* [Node](https://nodejs.org/en/download/current/) version 18.12.1 or later.
* [NPM](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) version 8.19.2 or later.


# Usage
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
# Commands
<!-- commands -->
* [`aws-sleek-transformer create-issue FILE`](#aws-sleek-transformer-create-issue-file)
* [`aws-sleek-transformer submit`](#aws-sleek-transformer-submit)
* [`aws-sleek-transformer validate [HELMURL] [FILE]`](#aws-sleek-transformer-validate-helmurl-file)

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

  TODO:
  * Run validation before creating the issue


EXAMPLES
  $ aws-sleek-transformer create-issue filename
```

_See code: [src/commands/create-issue.ts](https://github.com/aws-samples/addons-transformer-for-amazon-eks/blob/v0.0.1/src/commands/create-issue.ts)_

## `aws-sleek-transformer submit`

Submit the addon to the AWS marketplace

```
USAGE
  $ aws-sleek-transformer submit

DESCRIPTION
  Submit the addon to the AWS marketplace


  Sends the selected addon, version to the marketplace for final submission and upload it to Project Sleek.

  It reads from the addons stored in the config: ~/.sleek/config.json and presents them as options to the user to
  submit.

  The CLI requires the configure command to be run before hand to ensure there are correct configurations for each of
  the addons.

  This command requires the following:
  * Addon Name - as used in the configure command
  * Addon Version - as used in the configure command

  If no flags are provided, the CLI will launch an interactive menu which let's you select which addon to submit to
  the marketplace.


EXAMPLES
  $ aws-sleek-transformer submit
```

_See code: [src/commands/submit.ts](https://github.com/aws-samples/addons-transformer-for-amazon-eks/blob/v0.0.1/src/commands/submit.ts)_

## `aws-sleek-transformer validate [HELMURL] [FILE]`

Validates a given addon from the configuration provided through the 'configure' command

```
USAGE
  $ aws-sleek-transformer validate [HELMURL] [FILE] [--file <value>] [--helmUrl <value>] [--addonName <value>]

ARGUMENTS
  HELMURL  Helm URL of the addon
  FILE     Path to add-on input file

FLAGS
  --addonName=<value>  Name of the addon
  --file=<value>       Path to add-on input file
  --helmUrl=<value>    Helm URL of the addon

DESCRIPTION
  Validates a given addon from the configuration provided through the 'configure' command


  This performs pre-launch validations of the partner software on compatibility with Sleek guidelines, covering static
  and dynamic (deployment/runtime) aspects.

  Runs the static analysis to find occurrences of:
  * .Capabilities
  * helm.sh/hook
  * external helm dependencies

  It will perform a static validation on the device and then give you the option to submit it to the marketplace for
  runtime and further validation before it can be included in the EKS Console marketplace.


EXAMPLES
  $ aws-sleek-transformer validate
```

_See code: [src/commands/validate.ts](https://github.com/aws-samples/addons-transformer-for-amazon-eks/blob/v0.0.1/src/commands/validate.ts)_
<!-- commandsstop -->
