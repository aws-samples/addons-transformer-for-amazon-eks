import AWS from 'aws-sdk'
import { execSync } from 'child_process';
import { spawnSync } from 'child_process';

async function pullHelmChartAndValidate(inputParameters) {

    console.log(JSON.stringify(inputParameters, null, '  '));
    const addonName = inputParameters.addonName;
    const helmUrl = inputParameters.helmUrl;
    const addonVersion = inputParameters.addonVersion;
    const region = inputParameters.aws_region ;

    // Set your AWS region and credentials
    AWS.config.update({ region: region });
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
        console.log("Helm Url : " +helmUrl +"Helm Version : " +addonVersion)
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
            // Pull the Helm chart from ECR
            const pullCmd = `rm -rf ./unzipped-${addonName} && mkdir ./unzipped-${addonName} && helm pull ${helmUrl} --version ${addonVersion} -d ./unzipped-${addonName} && mv ./unzipped-${addonName}/$(ls ./unzipped-${addonName}/ | grep .tgz) ./unzipped-${addonName}/${addonName}.tgz && tar -xf ./unzipped-${addonName}/${addonName}.tgz --directory ./unzipped-${addonName} `;
            try {
                const result = execSync(pullCmd);
                console.log(result.toString());
                console.log('Helm Chart Pull is Successful!');
                // Search for occurrences of ".Capabilities" and "helm.sh/hook"
                const findCapabilities = spawnSync('grep', ['-R', '-i', '-l', '-e', '".Capabilities"', `./unzipped-${addonName}`]);
                const findHooks = spawnSync('grep', ['-R', '-i', '-l', '-e', '"helm.sh/hook"', `./unzipped-${addonName}`]);
                // Check the counts and exit if either is greater than zero
                if (findCapabilities.stdout > 0 || findHooks.stdout > 0) {
                    console.log('Found .Capabilities or helm.sh/hook in Helm chart');
                    process.exit(350);
                    } else {
                    console.log('No occurrences of .Capabilities or helm.sh/hook found in Helm chart');
                }
            } catch (error) {
                console.error(error);
                return;
            }
        } catch (error) {
            console.error(error);
            return;
        }
    });
    return new Promise((resolve) => {
        setTimeout(() => {
          console.log(`Function done`);
          resolve();
        }, 2000);
    });
}

export default pullHelmChartAndValidate

