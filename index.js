#!/usr/bin/env node
/***************************************************************/
/* Grab imports of internal modules used                       */
/***************************************************************/
import checkAndInstallDependencies from './modules/installDependencies.js';
import getUserInputs from './modules/getUserInputs.js'
import validateUserInputs from './modules/validateUserInputs.js';
import pullHelmChartAndValidate from './modules/pullHelmChartAndValidate.js';
// import createAndSubmitPullRequest from './modules/createAndSubmitPullRequest.js';
import forkAndSubmitPullRequest from './modules/forkAndSubmitPullRequest.js';

/***************************************************************/
/* We will install following dependencies to the terminal :    */
/* 1. kubectl                                                  */
/* 2. eksctl                                                   */
/* 3. helm                                                     */
/***************************************************************/
try {
    await checkAndInstallDependencies();
} catch (error) {
    console.error(error.message);
    process.exit(100);
}

/***************************************************************/
/* We will now grab following inputs from the terminal         */
/* 1. What's your Addon Name?                                  */
/* 2. Whats your Helm URL of the Addon?                        */
/* 3. Whats your Addon Version?                                */
/* 4. Whats your deployment namespace?                         */
/* 5. Whats your AWS Account id?                               */
/* 6. Whats your AWS Region ?                                  */
/***************************************************************/
let inputParameters = await getUserInputs();

/***************************************************************/
/* We will now validate the inputs from the user               */
/***************************************************************/
try {
    validateUserInputs(inputParameters);
    console.log('All User Inputs are Valid!');
} catch (error) {
    console.error(error.message);
    process.exit(200);
}

/***************************************************************/
/* We will now do the following:                               */
/* 1. Authenticate user to ECR Repo                            */
/* 2. Pull and Untar the Helm chart from ECR                   */
/* 3. Perform static validations to find occurences of :       */
/*    a. `.Capabilities`                                       */
/*    b. `helm.sh/hook`                                        */
/* 4. Read GitHub Token secret from AWS Secrets Manager        */
/* 5. Clone the GitHub repo of `aws-sleek-transformer`         */
/* 6. Submit a PR with the Addon extract                       */
/***************************************************************/
try {
    await pullHelmChartAndValidate(inputParameters)
        .then(() => {
        try {
            // createAndSubmitPullRequest(inputParameters);
            forkAndSubmitPullRequest(inputParameters);
        } catch (error) {
            console.error(error.message);
            process.exit(400);
        }
    });
} catch (error) {
    console.error(error.message);
    process.exit(300);
}



        
        


