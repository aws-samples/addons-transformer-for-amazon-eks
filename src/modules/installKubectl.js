import { exec }from 'child_process';

function checkKubectl() {
  return new Promise((resolve, reject) => {
    exec('kubectl version --client', (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

async function installKubectl() {
  console.log('kubectl not found. Installing...');
  const platform = process.platform;
  let command = '';

  switch (platform) {
    case 'darwin':
      command = 'brew install kubectl';
      break;
    case 'win32':
      command = 'choco install kubernetes-cli';
      break;
    default:
      command = 'curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && chmod +x kubectl && sudo mv kubectl /usr/local/bin/';
      break;
  }

  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        console.log('kubectl installed successfully');
        resolve(stdout);
      }
    });
  });
}

async function checkAndInstallKubectl() {
  try {
    const version = await checkKubectl();
    console.log(`kubectl version: ${version}`);
  } catch (error) {
    console.log(`Error: ${error.message}`);
    await installKubectl();
  }
}

export default checkAndInstallKubectl;