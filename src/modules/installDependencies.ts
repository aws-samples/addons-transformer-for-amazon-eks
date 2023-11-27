import checkAndInstallKubectl from './installKubectl.js'
import checkAndInstallEksctl from './installEksctl.js'
import checkAndInstallHelm from './installHelm.js'

async function checkAndInstallDependencies() {
    try {
      await checkAndInstallKubectl();
    } catch (error) {
      console.error('Error checking or installing Kubectl:', error);
    }
    try {
        await checkAndInstallEksctl();
      } catch (error) {
        console.error('Error checking or installing eksctl:', error);
    }
    try {
        await checkAndInstallHelm();
      } catch (error) {
        console.error('Error checking or installing Helm:', error);
    }
}

export default checkAndInstallDependencies;