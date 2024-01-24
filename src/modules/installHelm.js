import { exec }from 'child_process';

function checkAndInstallHelm() {
  return new Promise((resolve, reject) => {
    exec('helm version', (error, stdout, stderr) => {
      if (error) {
        reject(error);
      }
      if (stderr.includes('helm: command not found')) {
        console.log('Helm is not installed, installing...');
        exec('curl https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3 | bash', (error, stdout, stderr) => {
          if (error) {
            reject(error);
          }
          console.log('Helm installed successfully!');
          resolve();
        });
      } else {
        console.log('Helm is already installed.');
        resolve();
      }
    });
  });
}

export default checkAndInstallHelm;