import AWS from 'aws-sdk'
import { execSync } from 'child_process';

async function authenticateAndPullHelmChart(inputParameters) {

    // Set your ECR repository URL
    const repositoryUrl = inputParameters.aws_accountid+'.dkr.ecr.'+inputParameters.aws_region+'.amazonaws.com';
    console.log("ECR URL" +repositoryUrl)
    const helmUrl = inputParameters.helmUrl;
    const addonVersion = inputParameters.addonVersion;
    console.log("Helm Url :" +helmUrl +"Helm Version :" +helmUrl)

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
    const loginCmd = `docker login -u ${username} -p ${password} ${registryUrl}`;
    // Log in to ECR
    try {
        const result = execSync(loginCmd);
        console.log(result.toString());
    } catch (error) {
        console.error(error);
        return;
    }
    // Pull the Helm chart from ECR
    const pullCmd = `helm pull ${helmUrl} --version ${addonVersion}`;
    try {
        const result = execSync(pullCmd);
        console.log(result.toString());
    } catch (error) {
        console.error(error);
        return;
    }
    });

}

export default authenticateAndPullHelmChart

