const { execSync } = require('child_process');

async function extactAndValidate(inputTarFile) {
    // set the options
    const options = '--directory=unzipped';

    // untar the file
    execSync(`tar -xvzf ${inputTarFile} ${options}`);

    // search for keywords and count occurrences
    const keywords = ['.Capabilities', 'helm.sh/hook'];
    for (const keyword of keywords) {
    const cmd = `grep -Ril -e '${keyword}' unzipped | wc -l`;
    const count = execSync(cmd).toString().trim();
    console.log(`Keyword '${keyword}' found ${count} times.`);
    }
}