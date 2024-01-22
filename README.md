AWS Sleek Transformer CLI
=========================

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
* [`aws-sleek-transformer configure`](#aws-sleek-transformer-configure)
* [`aws-sleek-transformer submit`](#aws-sleek-transformer-submit)
* [`aws-sleek-transformer validate`](#aws-sleek-transformer-validate)

## `aws-sleek-transformer configure`

Sets up the Sleek CLI to work with a given helm chart

```
USAGE
  $ aws-sleek-transformer configure [--addonName <value>] [--addonVersion <value>] [--helmUrl <value>]
    [--marketplaceId <value>] [--namespace <value>] [--region <value>] [--kubeVersion <value>]

FLAGS
  --addonName=<value>      Name of the addon
  --addonVersion=<value>   Version of the addon
  --helmUrl=<value>        Helm URL of the addon
  --kubeVersion=<value>    Target Kubernetes version of the addon
  --marketplaceId=<value>  Marketplace AWS Account ID
  --namespace=<value>      Namespace of the addon
  --region=<value>         AWS Region

DESCRIPTION
  Sets up the Sleek CLI to work with a given helm chart


  Extracts information from the environment to populate information required for the Sleek CLI to function. If
  certain information is not found, prompts the user for it and asks them to validate the information extracted from
  the environment.

  This information is stored ~/.sleek/config.json
  Each of these configurations can be edited by passing the exact addon name and version.

  The CLI requires the following:
  * AWS Region
  * Marketplace AWS Account ID
  * Addon Name
  * Addon Version
  * Addon Helm Url
  * Deployment Namespace

  Each of these can be passed as flags to this command with the following flags:
  * --region
  * --marketplace_id
  * --addon_name
  * --addon_version
  * --helm_url
  * --namespace


EXAMPLES
  $ aws-sleek-transformer configure
```

_See code: [src/commands/configure.ts](https://github.com/elaramas/aws-sleek-transformer/blob/v0.0.1/src/commands/configure.ts)_

## `aws-sleek-transformer submit`

Uses the pre-existing configurations to submit the addon to the AWS marketplace

```
USAGE
  $ aws-sleek-transformer submit [--addonName <value>] [--addonVersion <value>]

FLAGS
  --addonName=<value>     Name of the addon to submit
  --addonVersion=<value>  Version of the addon to submit

DESCRIPTION
  Uses the pre-existing configurations to submit the addon to the AWS marketplace


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

_See code: [src/commands/submit.ts](https://github.com/elaramas/aws-sleek-transformer/blob/v0.0.1/src/commands/submit.ts)_

## `aws-sleek-transformer validate`

Validates a given addon from the configuration provided through the 'configure' command

```
USAGE
  $ aws-sleek-transformer validate [--addonName <value>] [--addonVersion <value>]

FLAGS
  --addonName=<value>     Name of the addon to validate
  --addonVersion=<value>  Version of the addon to validate

DESCRIPTION
  Validates a given addon from the configuration provided through the 'configure' command


  This performs pre-launch validations of the partner software on compatibility with Sleek guidelines, covering static
  and dynamic (deployment/runtime) aspects.

  Runs the static analysis to find occurrences of:
  * .Capabilities
  * helm.sh/hook

  This command requires the "configure" command to have been run, it needs:
  * Helm URL
  to be configured correctly.

  It will perform a static validation on the device and then give you the option to submit it to the marketplace for
  runtime and further validation before it can be included in the EKS Console marketplace.


EXAMPLES
  $ aws-sleek-transformer validate
```

_See code: [src/commands/validate.ts](https://github.com/elaramas/aws-sleek-transformer/blob/v0.0.1/src/commands/validate.ts)_
<!-- commandsstop -->
