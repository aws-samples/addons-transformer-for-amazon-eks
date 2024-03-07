# Demo recording commands:

## Show help
```shell
# Show command help
aws-sleek-transformer --help 
```

## Local chart validation

```shell
# Show command help
aws-sleek-transformer validate --help 
```

```shell
# Validate passing repo URI
aws-sleek-transformer validate oci://12345678901.dkr.ecr.us-east-2.amazonaws.com/example-charts:x.x.x   
```

```shell
# Validate passing individual components of Repo URL
aws-sleek-transformer validate -r 12345678901.dkr.ecr.us-east-2.amazonaws.com/example-charts -p oci -v x.x.x
```

```shell
# Validate from input file
aws-sleek-transformer validate --file ./examples/onboarding.example.yaml 
```

## GitHub Issue creation

```shell
# Show command help
aws-sleek-transformer create-issue --help 
```

```shell
# Creating issue from input file by JSON schema###
aws-sleek-transformer create-issue ./examples/onboarding.example.yaml --dry-run 
```

```shell
# Dry-run for validate input-yaml file 
aws-sleek-transformer create-issue ./examples/onboarding.example.yaml 
```

