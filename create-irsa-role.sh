#!/usr/bin/env bash
set -e

#### Script for creating an IRSA role for a cluster ####
#
# Optional environment variable overrides
#
# CLUSTER_NAME - The name of the cluster to create the IRSA role for
#
# STAGE - EKS stage to use: dev, beta, gamma, or prod [default]
#
# AWS_DEFAULT_REGION - the region to run in (default us-west-2)
#
# IAM_ROLE_NAME - The name of the IAM role to create (default eks-irsa-XXXXX)
#
# IAM_ROLE_POLICIES - Comma separated list of IAM policy ARNs [sets of permissions] to attach to the created IAM role (defaults to AWSLicenseManagerConsumptionPolicy and AWSMarketplaceMeteringRegisterUsage)
#
# SERVICE_ACCOUNT_NAMESPACE - The kubernetes namespace to allow the created role to be assumed in (default *)
#
# SERVICE_ACCOUNT_NAME - The name of the kubernetes service account to allow the created role to be assumed by (default *)

if ! command -v curl > /dev/null 2>&1; then
    echo "Could not find curl. Please install curl to run this script"
    exit 1
fi

if ! command -v jq > /dev/null 2>&1; then
    echo "Could not find jq. Please install jq to run this script"
    exit 1
fi

if ! command -v openssl > /dev/null 2>&1; then
    echo "Could not find openssl. Please install openssl to run this script"
    exit 1
fi

err_report() {
    echo "Exited with error on line $1"
}
trap 'err_report $LINENO' ERR

AWS_DEFAULT_REGION=${AWS_DEFAULT_REGION:-"us-west-2"}

IAM_ROLE_NAME=${IAM_ROLE_NAME:-"eks-irsa-$(openssl rand -base64 6 | tr -d '/')"}

IAM_ROLE_POLICIES=${IAM_ROLE_POLICIES:-"arn:aws:iam::aws:policy/service-role/AWSLicenseManagerConsumptionPolicy,arn:aws:iam::aws:policy/AWSMarketplaceMeteringRegisterUsage"}

SERVICE_ACCOUNT_NAMESPACE=${SERVICE_ACCOUNT_NAMESPACE:-*}

SERVICE_ACCOUNT_NAME=${SERVICE_ACCOUNT_NAME:-*}

ENDPOINT_FLAG=""
if [ -z "$ENDPOINT_FLAG" ]; then
    read -r -p "What is the env your want to connect? dev | beta | gamma " STAGE
fi
echo "Using environment $STAGE"
if [ "$STAGE" = "dev" ]; then
    USER_ID=$(whoami)
    DEV_ENDPOINT_PATH=${DEV_ENDPOINT_PATH:-Stage}
    API_GATEWAY_RESOURCE_ID=$(aws cloudformation describe-stack-resources \
    --stack-name sam-dev-$USER_ID-AWSWesleyFrontendLambda \
    --logical-resource-id LambdaAPIDefinition \
    --query 'StackResources[?LogicalResourceId==`LambdaAPIDefinition`]|[0:1].[PhysicalResourceId]' \
    --output text)
    ENDPOINT_FLAG="--endpoint-url=https://$API_GATEWAY_RESOURCE_ID.execute-api.$AWS_DEFAULT_REGION.amazonaws.com/$DEV_ENDPOINT_PATH/"
elif [ "$STAGE" = "beta" ]; then
    ENDPOINT_FLAG="--endpoint-url=https://api.beta.us-west-2.wesley.amazonaws.com"
elif [ "$STAGE" = "gamma" ]; then
    ENDPOINT_FLAG="--endpoint-url=https://eks.gamma.$AWS_DEFAULT_REGION.wesley.amazonaws.com"
fi

# The cluster name to use
if [ -z "$CLUSTER_NAME" ]; then
    read -r -p "What is the name of your cluster to use? " CLUSTER_NAME
fi
echo "Using cluster name $CLUSTER_NAME"

# Find existing or set up OIDC provider for the provided cluster
OIDC_URL=$(aws eks "$ENDPOINT_FLAG" describe-cluster --name "$CLUSTER_NAME" --query "cluster.identity.oidc.issuer" --output text)
if [ -z "$OIDC_URL" ]; then
    echo This cluster does not yet have an OIDC issuer. Please wait longer for this cluster to finish creating
    exit 1
fi
OIDC_NO_PROTO="${OIDC_URL//https:\/\//}"

OIDC_PROVIDER_ARN=$(aws iam list-open-id-connect-providers --query OpenIDConnectProviderList[].Arn --output table | grep "$OIDC_NO_PROTO" | awk '{ print $2 }')
if [ -z "$OIDC_PROVIDER_ARN" ]; then
    echo "Did not find existing IAM OIDC provider for cluster. Creating one now"
    OIDC_JWKS_DOMAIN="$(awk -F/ '{print $3}' <<<"$(curl -s "$OIDC_URL/.well-known/openid-configuration" | jq -r '.jwks_uri')")"
    OIDC_FINGERPRINT="$(echo | openssl s_client -servername "$OIDC_JWKS_DOMAIN" -showcerts -connect "$OIDC_JWKS_DOMAIN:443" 2>&1 | awk '/-BEGIN/ {a=$0;next} {a=a"\n"$0} END{print a}' | openssl x509 -fingerprint -noout | cut -d '=' -f2 | sed 's/://g')"
    OIDC_PROVIDER_ARN=$(aws iam create-open-id-connect-provider --url "$OIDC_URL" --client-id-list 'sts.amazonaws.com' --thumbprint-list "$OIDC_FINGERPRINT" --query OpenIDConnectProviderArn --output text)
    echo "Created IAM OIDC provider for cluster $OIDC_PROVIDER_ARN"
else
    echo "Found existing IAM OIDC provider for cluster $OIDC_PROVIDER_ARN"
fi

# Create the IAM role
TRUST_POLICY="{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Principal\":{\"Federated\":\"$OIDC_PROVIDER_ARN\"},\"Action\":\"sts:AssumeRoleWithWebIdentity\",\"Condition\":{\"StringLike\":{\"$OIDC_NO_PROTO:aud\":\"sts.amazonaws.com\",\"$OIDC_NO_PROTO:sub\":\"system:serviceaccount:$SERVICE_ACCOUNT_NAMESPACE:$SERVICE_ACCOUNT_NAME\"}}}]}"
IAM_ROLE_ARN=$(aws iam create-role --role-name "$IAM_ROLE_NAME" --assume-role-policy-document "$TRUST_POLICY" --description "IAM Role for EKS IRSA" --query Role.Arn --output text)
echo IAM role "$IAM_ROLE_NAME" created
DELETE_CMD="aws iam delete-role --role-name $IAM_ROLE_NAME"
# Attach the trust policies
for i in ${IAM_ROLE_POLICIES//,/ }; do
    aws iam attach-role-policy --role-name "$IAM_ROLE_NAME" --policy-arn "$i"
    DELETE_CMD="aws iam detach-role-policy --role-name $IAM_ROLE_NAME --policy-arn $i\n$DELETE_CMD"
done
echo Completed attaching policies to IAM role. Arn to use for IRSA:
echo
echo "$IAM_ROLE_ARN"
echo
echo In order to clean up resources, run the following commands:
echo -e "$DELETE_CMD"
