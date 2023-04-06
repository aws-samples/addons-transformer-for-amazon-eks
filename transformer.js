#!/usr/bin/env node
import checkAndInstallDependencies from './modules/installDependencies.js';
import getUserInputs from './modules/getUserInputs.js'
import validateUserInputs from './modules/validateUserInputs.js';
import authenticateAndPullHelmChart from './modules/downloadHelmChart.js';

try {
    await checkAndInstallDependencies();
} catch (error) {
    console.error(error.message);
    process.exit(100);
}


let inputParameters = await getUserInputs();
console.log(JSON.stringify(inputParameters, null, '  '));

try {
    validateUserInputs(inputParameters);
    console.log('All User Inputs are Valid!');
} catch (error) {
    console.error(error.message);
    process.exit(200);
}

try {
    await authenticateAndPullHelmChart(inputParameters);
    console.log('Helm Chart Pull is Successful!');
} catch (error) {
    console.error(error.message);
    process.exit(300);
}

