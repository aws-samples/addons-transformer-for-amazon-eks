import {BaseService} from "./base-service.js";
import {ServiceResponse} from "../types/service.js";
import {execSync} from "child_process";

export default class HelmManagerService extends BaseService {
  public async pullAndUnzipChart(helmUrl: string, addonName: string, helmProtocol: string = "oci", chartTag: string = ""): Promise<string> {
    const chartVersionFlag = !! chartTag ? `--version ${chartTag}`:''
    const untarLocation = `./unzipped-${addonName}`;
    const pullCmd = `rm -rf ${untarLocation} && 
                             mkdir ${untarLocation} && 
                             helm pull ${helmProtocol}://${helmProtocol} ${chartVersionFlag} --untar --untardir ${untarLocation} >/dev/null 2>&1`;
    try {
      execSync(pullCmd);
    } catch (e) {
      this.error(`Helm chart pull failed with error ${e}`);
    }
    return untarLocation;
  }
}
