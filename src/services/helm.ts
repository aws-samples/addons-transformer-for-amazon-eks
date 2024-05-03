import {execSync} from "node:child_process";

import {BaseService} from "./base-service.js";

export default class HelmManagerService extends BaseService {
  public async pullAndUnzipChart(helmUrl: string, helmProtocol: string = "oci", chartTag: string = "",  addonName?: string): Promise<string> {
    // if addonName is not provided, make it random
    addonName ||= `addon-${Math.random().toString(36).slice(7)}`;

    const chartVersionFlag =  chartTag ? `--version ${chartTag}`:''
    const untarLocation = `./unzipped-${addonName}`;
    const pullCmd = `rm -rf "${untarLocation}" && 
                             mkdir "${untarLocation}" && 
                             helm pull ${helmProtocol}://${helmUrl} ${chartVersionFlag} --untar --untardir "${untarLocation}" >/dev/null`;
    try {
      execSync(pullCmd);
    } catch (error) {
      this.error(`Helm chart pull failed with error ${error}`);
    }

    return untarLocation;
  }
}
