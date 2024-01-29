// remove the config persisted --
// extract validating into this service
// add parameter for extend testing
// add a second parameter that's "internal version" number maintained by us

import {spawnSync} from "child_process";
import {BaseService} from "./base-service.js";
import {ServiceResponse} from "../types/service.js";
import {SleekCommand} from "../sleek-command.js";

export default class ChartValidatorService extends BaseService {
  // this will always be a local filepath
  private toValidate: string;

  constructor(commandCaller: SleekCommand, toValidate: string) {
    super(commandCaller);
    this.toValidate = toValidate;
  }

  public async extendedValidation(localFile?: string) {

  }

  public async validate(): Promise<ServiceResponse<any>> {
    const capabilities = await this.findCapabilities();
    const hooks = await this.findHooks();
    const dependencies = await this.findDependencies();

    let response: ServiceResponse<string> = {
      success: false,
      body: "",
      error: {
        input: "",
        options: {
          code: "",
          exit: 5
        }
      }
    };

    if (capabilities.success && hooks.success && dependencies.success) {
      response = {
        success: true,
        body: "Addon pre-validation complete"
      }
      return response;
    }
    if (!capabilities.success) {
      response = {
        success: false,
        body: response.body + "Capabilities detected.",
        error: {
          input: response.error?.input + " " + capabilities.error?.input!,
        }
      }
    }
    if (!hooks.success) {
      response = {
        success: false,
        body: response.body + " \n" + "  * Hooks detected.",
        error: {
          input: response.error?.input + " " + hooks.error?.input!,
        }
      }
    }
    if (!dependencies.success) {
      response = {
        success: false,
        body: response.body + " \n" + "  * Dependencies detected.",
        error: {
          input: response.error?.input + " " + dependencies.error?.input!,
        }
      }
    }

    return response;
  }

  private async findCapabilities(): Promise<ServiceResponse<string>> {
    const capabilities = spawnSync('grep', ['-Rile', '".Capabilities"', this.toValidate], {
      shell: true,
      encoding: "utf-8"
    });

    let response: ServiceResponse<string>;

    if (capabilities.stdout === "") {
      response = {
        success: true,
      }
    } else {
      response = {
        success: false,
        body: "Unsupported system Capabilities are used in chart.",
        error: {
          input: capabilities.stdout,
          options: {
            code: "E501",
            exit: 1
          }
        }
      }
    }

    return response;
  }

  private async findHooks(): Promise<ServiceResponse<string>> {
    const hooks = spawnSync('grep', ['-Rile', '".Hooks"', this.toValidate], {shell: true, encoding: "utf-8"});

    let response: ServiceResponse<string>;
    if (hooks.stdout === "") {
      response = {
        success: true,
      }
    } else {
      response = {
        success: false,
        body: "Unsupported system Hooks are used in chart.",
        error: {
          input: hooks.stdout,
          options: {
            code: "E502",
            exit: 1
          }
        }
      }
    }

    return response;
  }

  private async findDependencies(): Promise<ServiceResponse<string>> {
    const grepDependencies = spawnSync('helm', ['dependency', 'list', this.toValidate], {
      shell: true,
      encoding: "utf-8"
    });

    // split every line in the output
    // discard headers
    // in every subsequent line, get the output at index 1 (which is the relative path of a dependency)
    const dependencies = grepDependencies.stdout.toString()
      .split('/n')
      .slice(1)
      .map(line => line.split('/t')[1]);

    let response: ServiceResponse<string>;

    // check dependencies to ensure they all contain file://
    const allDepsFiles = dependencies.every(dep => dep.includes('file://'));

    if (allDepsFiles) {
      response = {
        success: true,
      }
    } else {
      response = {
        success: false,
        body: "Not all dependencies reside in the main chart.",
        error: {
          input: dependencies.toString(),
          options: {
            code: "E503",
            exit: 1
          }
        }
      }
    }

    return response;
  }
}
