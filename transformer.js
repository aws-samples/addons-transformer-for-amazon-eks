#!/usr/bin/env node
import checkAndInstallDependencies from './modules/installDependencies.js';
import getUserInputs from './modules/getUserInputs.js'
import validateUserInputs from './modules/validateUserInputs.js';

await checkAndInstallDependencies();

let inputParameters = await getUserInputs();
console.log(JSON.stringify(inputParameters, null, '  '));

try {
    validateUserInputs(inputParameters);
    console.log('All User Inputs are Valid!');
} catch (error) {
    console.error(error.message);
}

