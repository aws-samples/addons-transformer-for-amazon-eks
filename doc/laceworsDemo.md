# Onboarding Laceworks demo

## Assumptions:
Docker images are on ECR at `us-east-1`
Referred images have been replaced in the chart

## Manual fixes:
- Docker image pulled and pushed to ECR
- Provided value for `image.overrideValue` pointing to the image in 1
- Updated amended chart pushed to ecr

## Input file:
[onboarding.example.laceworks](./examples/onboarding.example.laceworks.yaml)

# Issues discovered
1. They had mandatory parameters in `values.yaml` -> not supported
2. Use a computed image -> no automatic substitution
3. Having only **one** product placeholder can make new request to fail if the previous didn't finish as the product is locked
4. Docker images need to be pulled and pushed multi-arch 

# Links
[AWS Marketplace management portal](https://aws.amazon.com/marketplace/management/requests)
[Running action](https://github.com/cloudsoft-fusion/aws-eks-addon-publication/actions)

# Useful commands

```shell
export ECR_HELM_REPOSITORY=304295633295.dkr.ecr.eu-west-1.amazonaws.com/cloudsoft-amp-helm
aws ecr get-login-password --region eu-west-1 | helm registry login --username AWS --password-stdin ${ECR_HELM_REPOSITORY%%/*}
```

## Login public ECR login in Cloudsoft repo for Lacework
```shell
export ECR_HELM_REPOSITORY=304295633295.dkr.ecr.us-east-1.amazonaws.com/lacework-agent
aws ecr get-login-password --region us-east-1 | helm registry login --username AWS --password-stdin ${ECR_HELM_REPOSITORY%%/*}
```

## Push lacework chart
```shell
export ECR_HELM_REPOSITORY=304295633295.dkr.ecr.us-east-1.amazonaws.com/lacework-agent
helm push lacework-agent-5.2.0-cs.tgz oci://${ECR_HELM_REPOSITORY%%/*}
```

## Login public ECR
```shell
aws ecr-public get-login-password \
  --region us-east-1 | helm registry login \
  --username AWS \
  --password-stdin public.ecr.aws
```
