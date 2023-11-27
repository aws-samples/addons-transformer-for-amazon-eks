import inquirer from 'inquirer';

async function getUserInputs() {

    const questions = [
        {
            type: 'input',
            name: 'addonName',
            message: "What's your Addon Name?",
        },
        {
            type: 'input',
            name: 'helmUrl',
            message: "Whats your Helm URL of the Addon?",
        },
        {
            type: 'input',
            name: 'addonVersion',
            message: "Whats your Addon Version?",
        },
        {
            type: 'input',
            name: 'namespace',
            message: "Whats your deployment namespace?",
        },
        {
            type: 'input',
            name: 'aws_accountid',
            message: "Whats your AWS Account id?",
        },
        {
            type: 'input',
            name: 'aws_region',
            message: "Whats your AWS Region ?",
        },
    ];
    
    const answers = await inquirer.prompt(questions);
    return answers;
}

export default getUserInputs;