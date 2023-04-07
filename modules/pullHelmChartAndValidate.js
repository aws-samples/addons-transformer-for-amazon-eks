import AWS from 'aws-sdk'
import { execSync } from 'child_process';
import { spawnSync } from 'child_process';

async function pullHelmChartAndValidate(inputParameters) {

    const helmUrl = inputParameters.helmUrl;
    const addonVersion = inputParameters.addonVersion;
    console.log("Helm Url : " +helmUrl +"Helm Version : " +addonVersion)

    // Set your AWS region and credentials
    AWS.config.update({ region: inputParameters.aws_region });
    const ecr = new AWS.ECR();
    // Get the ECR login command
    const loginParams = {
    registryIds: [ inputParameters.aws_accountid ]
    };
    ecr.getAuthorizationToken(loginParams, (err, data) => {
    if (err) {
        console.log(err);
        return;
    }
    const token = data.authorizationData[0].authorizationToken;
    const decodedToken = Buffer.from(token, 'base64').toString().split(':');
    const username = decodedToken[0];
    const password = decodedToken[1];
    const registryUrl = data.authorizationData[0].proxyEndpoint;
    console.log("registryUrl : " +registryUrl)
    const loginCmd = `helm registry login -u ${username} -p ${password} ${registryUrl}`;
    // Log in to ECR
    try {
        const result = execSync(loginCmd);
        console.log(result.toString());
    } catch (error) {
        console.error(error);
        return;
    }
    // Pull the Helm chart from ECR
    const folderPath = './unzipped';
    const pullCmd = `mkdir ${folderPath}  && helm pull ${helmUrl} --version ${addonVersion} --untar --untardir ${folderPath}`;
    try {
        const result = execSync(pullCmd);
        console.log(result.toString());
        console.log('Helm Chart Pull is Successful!');
    } catch (error) {
        console.error(error);
        return;
    }
    });

    // Search for occurrences of ".Capabilities" and "helm.sh/hook"
    const findCapabilities = spawnSync('grep', ['-R', '-i', '-l', '-e', '".Capabilities"', folderPath]);
    const findHooks = spawnSync('grep', ['-R', '-i', '-l', '-e', '"helm.sh/hook"', folderPath]);
    // Check the counts and exit if either is greater than zero
    if (findCapabilities.stdout > 0 || findHooks.stdout > 0) {
        console.log('Found .Capabilities or helm.sh/hook in Helm chart');
        process.exit(350);
        } else {
        console.log('No occurrences of .Capabilities or helm.sh/hook found in Helm chart');
    }
}

export default pullHelmChartAndValidate

