#!/usr/bin/env bash
set -e


if ! command -v helm > /dev/null 2>&1; then
    echo "Could not find helm. Please install helm to run this script"
    exit 1
fi

if ! command -v jq > /dev/null 2>&1; then
    echo "Could not find jq. Please install jq to run this script"
    exit 1
fi

# Example call using params - 
# ./testAddON.sh -n tetrate -h oci://709825985650.dkr.ecr.us-east-1.amazonaws.com/tetrate-io/tetrate-istio -v 1.15.3-new1113 -m istio-system -k 1.23 -t aws-mp-eksaddon-test-2 -x v1.1.0-eksbuild.0
# ./testAddON.sh -n datree-free -h oci://709825985650.dkr.ecr.us-east-1.amazonaws.com/datree/datree-free-admission-webhook-awsmp -v 1.0.1-rc.1 -m datree -k 1.23 -t aws-mp-eksaddon-test-2 -x v1.1.0-eksbuild.0


while getopts n:h:v:m:i:k:t:x:s: flag
do
	case "${flag}" in
		n) name=${OPTARG};;
		h) helmurl=${OPTARG};;
		v) version=${OPTARG};;
		m) namespace=${OPTARG};;
		i) irsapolicyarn=${OPTARG};;
		k) kubeversion=${OPTARG};;
		t) testaddon=${OPTARG};;
    x) testaddonversion=${OPTARG};;
    s) skipstaticvalidations=${OPTARG}
	esac
done

# The addOn name
if [ -z "$name" ]; then
    read -r -p "What is the name of AddON to test? " name
fi
# The mp helm url
if [ -z "$helmurl" ]; then
    read -r -p "Do you have the aws mp helm url to for the marketplace product? " helmurl
fi
# The addOn version
if [ -z "$version" ]; then
    read -r -p "What is the version of AddON to test? " version
fi
# The addOn namespace
if [ -z "$namespace" ]; then
    read -r -p "What is the namespace of AddON to test? " namespace
fi
# The addOn irsa policies - marking IRSA policies as optional
#if [ -z "$irsapolicyarn" ]; then
#    read -r -p "Does the addon needs an irsa role policy to connect with other aws services? If so, please enter the policy arn " irsapolicyarn
#fi
# Test Cluster
if [ -z "$kubeversion" ]; then
    read -r -p "Pick a kubeversion and enter it 1.22 1.23 1.24] " kubeversion
fi
# Test AddOn Config
if [ -z "$testaddon" ]; then
    read -r -p "Pick one of the available test addons - 
    1) Name: aws-mp-eksaddon-test-1 Version: v1.1.0-eksbuild.0,
    2) Name: aws-mp-eksaddon-test-2 Version: v1.1.0-eksbuild.0,
    3) Name: aws-mp-eksaddon-test-2 Version: v1.2.0-eksbuild.0, 
    4) Name: aws-mp-eksaddon-test-3 Version: v1.1.0-eksbuild.0, 
    5) Name: aws-mp-eksaddon-test-3 Version: v1.5.0-eksbuild.0,
    6) Name: aws-mp-eksaddon-test-3 Version: v1.6.1-eksbuild.0,
    7) Name: aws-mp-eksaddon-test-4 Version: v1.1.1-eksbuild.0,
    8) Name: aws-mp-eksaddon-test-4 Version: v1.10.2-eksbuild.0,
    9) Name: aws-mp-eksaddon-test-4 Version: v1.4.1-eksbuild.0

    " taddon
fi

if [ "$taddon" = "1" ]; then
	testaddon="aws-mp-eksaddon-test-1"
    testaddonversion="v1.1.0-eksbuild.0"
    testaddonchartfile="awsmp-testaddon-1-v1-1-0"
fi
if [ "$taddon" = "2" ]; then
	testaddon="aws-mp-eksaddon-test-2"
    testaddonversion="v1.1.0-eksbuild.0"
    testaddonchartfile="awsmp-testaddon-2-v1-1-0"
fi
if [ "$taddon" = "3" ]; then
	testaddon="aws-mp-eksaddon-test-2"
    testaddonversion="v1.2.0-eksbuild.0"
    testaddonchartfile="awsmp-testaddon-2-v1-2-0"
fi
if [ "$taddon" = "4" ]; then
	testaddon="aws-mp-eksaddon-test-3"
    testaddonversion="v1.1.0-eksbuild.0"
    testaddonchartfile="awsmp-testaddon-3-v1-1-0"
fi
if [ "$taddon" = "5" ]; then
	testaddon="aws-mp-eksaddon-test-3"
    testaddonversion="v1.5.0-eksbuild.0"
    testaddonchartfile="awsmp-testaddon-3-v1-5-0"
fi
if [ "$taddon" = "6" ]; then
	testaddon="awsmp-testaddon-3"
    testaddonversion="v1.6.1-eksbuild.0"
    testaddonchartfile="awsmp-testaddon-3-v1-6-1"
fi
if [ "$taddon" = "7" ]; then
	testaddon="awsmp-testaddon-4"
    testaddonversion="v1.1.1-eksbuild.0"
    testaddonchartfile="awsmp-testaddon-4-v1-1-1"
fi
if [ "$taddon" = "8" ]; then
	testaddon="awsmp-testaddon-4"
    testaddonversion="v1.10.2-eksbuild.0"
    testaddonchartfile="awsmp-testaddon-4-v1-10-2"
fi
if [ "$taddon" = "9" ]; then
	testaddon="awsmp-testaddon-4"
    testaddonversion="v1.4.1-eksbuild.0"
    testaddonchartfile="awsmp-testaddon-4-v1-4-1"
fi


 # If the addon name is selected  
if [ "$testaddon" = "aws-mp-eksaddon-test-1" ]; then
    echo "Picking chart file 1"
    if [ "$testaddonversion" = "v1.1.0-eksbuild.0" ]; then
      testaddonchartfile="awsmp-testaddon-1-v1-1-0"
    fi
fi
if [ "$testaddon" = "aws-mp-eksaddon-test-2" ]; then

    if [ "$testaddonversion" = "v1.1.0-eksbuild.0" ]; then
      echo "Picking chart file 2"
      testaddonchartfile="awsmp-testaddon-2-v1-1-0"
    fi
    if  [ "$testaddonversion" = "v1.2.0-eksbuild.0" ]; then
      echo "Picking chart file 3"
      testaddonchartfile="awsmp-testaddon-2-v1-2-0"
    fi
fi
if [ "$testaddon" = "aws-mp-eksaddon-test-3" ]; then
    if  [ "$testaddonversion" = "v1.1.0-eksbuild.0" ]; then
      echo "Picking chart file 4"
      testaddonchartfile="awsmp-testaddon-3-v1-1-0"
    fi
    if [ "$testaddonversion" = "v1.5.0-eksbuild.0" ]; then
      echo "Picking chart file 5"
      testaddonchartfile="awsmp-testaddon-3-v1-5-0"
    fi
    if [ "$testaddonversion" = "v1.6.1-eksbuild.0" ]; then
      echo "Picking chart file 6"
      testaddonchartfile="awsmp-testaddon-3-v1-6-1"
    fi
fi
if [ "$testaddon" = "aws-mp-eksaddon-test-4" ]; then
    if [ "$testaddonversion" = "v1.1.1-eksbuild.0" ]; then
      echo "Picking chart file 7"
      testaddonchartfile="awsmp-testaddon-4-v1-1-1"
    fi
    if [ "$testaddonversion" ="v1.10.2-eksbuild.0" ]; then
       echo "Picking chart file 8"
       testaddonchartfile="awsmp-testaddon-4-v1-10-2"
    fi
    if [ "$testaddonversion" = "v1.4.1-eksbuild.0" ]; then
       echo "Picking chart file 9"
        testaddonchartfile="awsmp-testaddon-4-v1-4-1"
    fi
fi

# Flag for skipping static validations
if [ -z "$skipstaticvalidations" ]; then
#    read -r -p "Do you want to skip static validations? y/n ] " skipstaticvalidations
# Defaulting Static validations
skipstaticvalidations=n
fi



echo "AddON Name: ${name}";
echo "AddON Helm URL: ${helmurl}";
echo "AddON Verion: ${version}";
echo "AddON Namespace: ${namespace}";
echo "AddON irsapolicyarn: ${irsapolicyarn}";
echo "AddON kubeversion: ${kubeversion}";
echo "AddON testaddon: ${testaddon}";
echo "AddON testaddon version: ${testaddonversion}";
echo "AddON testaddon chartfile: ${testaddonchartfile}";

# create irsa role in beta account using script from EKS engineering


#Update Current Context to point to an existing EKS Cluster (based on kubernetes version to be validated - Provided in metadata intake from ISV)
TESTCLUSTER=""
irsarole=""
if [ "$kubeversion" = "1.21" ]; then
	TESTCLUSTER="swami-sleek-test-1-21"
    irsarole=
fi
if [ "$kubeversion" = "1.22" ]; then
	TESTCLUSTER="swami-sleek-test-1-22"
    irsarole=""
fi
if [ "$kubeversion" = "1.23" ]; then
	TESTCLUSTER="swami-test-cluster-1-23"
    irsarole="arn:aws:iam::204409763375:role/eks-irsa-gmW3rcLx"
fi
if [ "$kubeversion" = "1.24" ]; then
    TESTCLUSTER="swami-test-cluster-1-24"
    irsarole="arn:aws:iam::204409763375:role/eks-irsa-lf4GEiGs"
fi
if [ "$kubeversion" = "1.25" ]; then
    TESTCLUSTER="swami-test-cluster-1-25"
fi

export TESTCLUSTER=$TESTCLUSTER
export TESTADDONENAME=$testaddon

## appending extra policies to irsa role for addon testing.
if [ -n "$irsapolicyarn" ]; then
aws iam attach-role-policy --policy-arn irsapolicyarn --role-name irsarole
fi

aws eks update-kubeconfig --region us-west-2 --name $TESTCLUSTER --endpoint https://api.beta.us-west-2.wesley.amazonaws.com

kubectl config current-context

NAMESPACES_EXIST=$(kubectl get ns ${namespace} -o json | jq .status.phase -r)
#Validate if exist namespace else Create namespace 
if [ -z "$NAMESPACES_EXIST" ]; then
	kubectl create namespace ${namespace}
fi

#clean up existing directory
rm -rf ~/awsmp-chart/${name}

#create a addOn testing directory
mkdir -p ~/awsmp-chart/${name}
cd ~/awsmp-chart/${name}

#download the helm chart
export HELM_EXPERIMENTAL_OCI=1
aws ecr get-login-password --region us-east-1 | helm registry login --username AWS --password-stdin 709825985650.dkr.ecr.us-east-1.amazonaws.com
helm pull ${helmurl} --version ${version} 
echo "Downloaded HELM chart Verison ${version} from ${helmurl}"

#CHART_DIRECTORY=""
#for file in ~/awsmp-chart/${name}; do
#    if [ -d "$file" ]; then
#        # If directory, check if this is the helm chart directory (by looking for Chart.yaml)
#        if [ -e "$file/Chart.yaml" ]; then
#            CHART_DIRECTORY="$file"
#            # Get a reproduceable hash based on all of the files and their contents within the chart directory
#            MANIFEST_HASH="$(find "$file" -type f -exec $SHA_COMMAND {} \; | awk '{ print $1 }' | sort | $SHA_COMMAND | awk '{ print $1 }')"
#            continue
#        fi
#    fi
#done

#Generate manifest
#helm template ${name} ~/awsmp-chart/${name}/${CHART_DIRECTORY} -n ${namespace} --include-crds > ~/awsmp-chart/${name}/${testaddon}.yaml


#Rename helm chart
mv $(ls | grep .tgz) "${testaddonchartfile}.tgz"
echo "Renamed chart to ${testaddonchartfile}.tgz"

if [ "$skipstaticvalidations" = "n" ]; then
# unzipping the chart to do static validations
echo "Unzipping Helm chart to do Static validations"
mkdir unzipped
tar -xf ${testaddonchartfile}.tgz --directory unzipped
cd unzipped
STATIC_VALIDATION=0
CAPABILITIESVersionsCOUNT=$(grep -Ril -e '.Capabilities.' | wc -l)
if [ ${CAPABILITIESVersionsCOUNT} -gt 0 ]; then
   echo "***** Errors - Chart has .Capabilities references. Please ask the ISV to fix the below files for .Capabilities references.*****"
   grep -Ril -e '.Capabilities.'
   STATIC_VALIDATION=1
fi

HELMHOOKCOUNT=$(grep -Ril -e 'helm.sh/hook' | wc -l)
if [ ${HELMHOOKCOUNT} -gt 0 ]; then
 echo "***** Errors - Chart has HELM hooks references. Please ask the ISV to fix the below files and remove HELM hook references.***** "
 grep -Ril -e 'helm.sh/hook'
 STATIC_VALIDATION=1
fi

if [ ${STATIC_VALIDATION} == 1 ]; then
  echo "***** Aborting Validations *****"
  exit 1
fi
fi


#Upload manifest generated to S3 bucket
aws s3 cp --acl bucket-owner-full-control ~/awsmp-chart/${name}/"${testaddonchartfile}.tgz" s3://addonoperator-beta-pdx-c-addonsmanifestbucket21fd-knr1rnk8sfle/helm-templates/



#Create AddOn in beta 
#if [ -z "$irsapolicyarn" ]; then
#aws eks create-addon --addon-name $testaddon --addon-version ${testaddonversion} --cluster-name $TESTCLUSTER --region us-west-2 --endpoint https://api.beta.us-west-2.wesley.amazonaws.com --resolve-conflict OVERWRITE
#else 
aws eks create-addon --addon-name $testaddon --addon-version ${testaddonversion} --cluster-name $TESTCLUSTER --service-account-role-arn $irsarole --region us-west-2 --endpoint https://api.beta.us-west-2.wesley.amazonaws.com --resolve-conflict OVERWRITE
#fi

echo "Create Addon submitted successfully";

#Describe AddOn Status
# TODO- Decide whether we loop the check status call
echo "Here are the details of the addon";

aws eks describe-addon --addon-name $testaddon --cluster-name $TESTCLUSTER --region us-west-2 --endpoint https://api.beta.us-west-2.wesley.amazonaws.com

echo "Federate into Pre-Production account of Containers Isengard to check addon status. Check logs in wesley account";
