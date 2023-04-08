# Sleek Marketplace validator

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
4. Performs static validations to find occurences of :       
    - `.Capabilities`
    - `helm.sh/hook`
5. Reads GitHub Token secret from AWS Secrets Manager.
6. Clones the GitHub repo `aws-sleek-transformer`
7. Submits a PR with the Addon tar to the repo.

## Pre-requisites

To implement this solution, you need the following prerequisites:

* The [AWS Command Line Interface](http://aws.amazon.com/cli) (AWS CLI) [installed](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html). The AWS CLI is a unified tool to manage your AWS services.
* AWS CLI default profile should be configured to access your AWS Account with region `us-east-1`.
* [Node](https://nodejs.org/en/download/current/) version 18.12.1 or later.
* [NPM](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) version 8.19.2 or later.
* A secret by name `github-access-token-secret` with your github token as plain text should be created in AWS Secrets Manager in `us-east-1` region.

## Deployment

Download the npm module for aws-sleek-transformer using following command :

```bash
npm i aws-sleek-transformer
```
## Testing

Run the `node aws-sleek-transformer` command to see the below command line to input parameters :

```bash
❯ node aws-sleek-transformer
(node:447500) NOTE: We are formalizing our plans to enter AWS SDK for JavaScript (v2) into maintenance mode in 2023.

Please migrate your code to use AWS SDK for JavaScript (v3).
For more information, check the migration guide at https://a.co/7PzMCcy
(Use `node --trace-warnings ...` to show where the warning was created)
kubectl version: Client Version: version.Info{Major:"1", Minor:"26", GitVersion:"v1.26.1", GitCommit:"8f94681cd294aa8cfd3407b8191f6c70214973a4", GitTreeState:"clean", BuildDate:"2023-01-18T15:51:24Z", GoVersion:"go1.19.5", Compiler:"gc", Platform:"linux/amd64"}
Kustomize Version: v4.5.7

eksctl is already installed.
Helm is already installed.
? What's your Addon Name? datree
? Whats your Helm URL of the Addon? oci://<AWS Account>.dkr.ecr.us-east-1.amazonaws.com/datree/datree-free-admission-webhook-awsmp
? Whats your Addon Version? 1.0.1-rc.1
? Whats your deployment namespace? datree
? Whats your AWS Account id? <AWS Account>
? Whats your AWS Region ? us-east-1
```

Below is the output of the execution :

```
All User Inputs are Valid!
{
  "addonName": "datree",
  "helmUrl": "oci://<AWS Account>.dkr.ecr.us-east-1.amazonaws.com/datree/datree-free-admission-webhook-awsmp",
  "addonVersion": "1.0.1-rc.1",
  "namespace": "datree",
  "aws_accountid": "<AWS Account>",
  "aws_region": "us-east-1"
}
Helm Url : oci://<AWS Account>.dkr.ecr.us-east-1.amazonaws.com/datree/datree-free-admission-webhook-awsmpHelm Version : 1.0.1-rc.1
registryUrl : https://<AWS Account>.dkr.ecr.us-east-1.amazonaws.com
WARNING: Using --password via the CLI is insecure. Use --password-stdin.
Login Succeeded

Pulled: <AWS Account>.dkr.ecr.us-east-1.amazonaws.com/datree/datree-free-admission-webhook-awsmp:1.0.1-rc.1
Digest: sha256:ca9bb6e5063f4065d5883756ce062add8585110f2dd4c16507ac08f4cf63f950

Helm Chart Pull is Successful!
No occurrences of .Capabilities or helm.sh/hook found in Helm chart
Function done
Cloning into '.'...
Already on 'main'
error: branch 'feature/datree' not found.
Switched to a new branch 'feature/datree'
remote:
remote: Create a pull request for 'feature/datree' on GitHub by visiting:
remote:      https://github.com/elamaran11/aws-sleek-transformer/pull/new/feature/datree
remote:
To https://github.com/elamaran11/aws-sleek-transformer.git
 * [new branch]      feature/datree -> feature/datree
```

