# Demo recording commands:

## Show help
```shell
# Show command help
addons-transformer-for-amazon-eks --help 
```

## Local chart validation

```shell
# Show command help
addons-transformer-for-amazon-eks validate --help 
```

```shell
# Validate passing repo URI
addons-transformer-for-amazon-eks validate oci://12345678901.dkr.ecr.us-east-2.amazonaws.com/example-charts:x.x.x   
```

```shell
# Validate passing individual components of Repo URL
addons-transformer-for-amazon-eks validate -r 12345678901.dkr.ecr.us-east-2.amazonaws.com/example-charts -p oci -v x.x.x
```

```shell
# Validate from input file
addons-transformer-for-amazon-eks validate --file ./examples/onboarding.example.yaml 
```

## GitHub Issue creation

```shell
# Show command help
addons-transformer-for-amazon-eks create-issue --help 
```

```shell
# Creating issue from input file by JSON schema###
addons-transformer-for-amazon-eks create-issue ./examples/onboarding.example.yaml --dry-run 
```

```shell
# Dry-run for validate input-yaml file 
addons-transformer-for-amazon-eks create-issue ./examples/onboarding.example.yaml 
```

