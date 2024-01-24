import { execSync }from 'child_process';

async function checkAndInstallEksctl() {
  // TODO: Add validation for uname -s to ensure it gives the correct stuff
  try {
    // Check if eksctl is installed
    execSync('eksctl version');
    console.log('eksctl is already installed.');
  } catch (error) {
    // If eksctl is not installed, install it using curl and bash
    console.log('eksctl is not installed. Installing now...');
    execSync(
      'curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp && sudo mv /tmp/eksctl /usr/local/bin',
      { stdio: 'inherit' }
    );
    console.log('eksctl installed successfully!');
  }
}

export default checkAndInstallEksctl;