import {BaseService, ServiceResponse} from "./base-service.js";

export default class HelmManagerService extends BaseService {
  public static async pullAndUnzipChart() {

  }

  run(): Promise<ServiceResponse<any>> {
    return Promise.resolve({
      success: false,
      error: {
        input: "Not Implemented",
        options: {
          code: "E404",
          exit: 1
        }
      }
    });
  }
}