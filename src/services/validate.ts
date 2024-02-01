// remove the config persisted --
// extract validating into this service
// add parameter for extend testing
// add a second parameter that's "internal version" number maintained by us

import {spawnSync} from "child_process";
import {BaseService} from "./base-service.js";
import {ServiceResponse} from "../types/service.js";
import {SleekCommand} from "../sleek-command.js";
import {ValidateOptions} from "../types/validate.js";

export const SuccessResponse:ServiceResponse<string> = {
  success: true,
};

export const ValidationSkipped:ServiceResponse<string> = {
  success: true,
  body:'validation skipped'
};
export const ExtendValidationSuccess:ServiceResponse<string> = {
  success: true,
  body:'Extend validation to be implemented; SUCCESS'
};
export const ExtendValidationFail:ServiceResponse<string> = {
  success: false,
  error:{
    input: 'Extend validation to be implemented; FAIL',
    options:{
      exit:2,
    }
  }
};

export default class ChartValidatorService extends BaseService {
  // this will always be a local filepath
  private toValidate: string;

  constructor(commandCaller: SleekCommand, toValidate: string) {
    super(commandCaller);
    this.toValidate = toValidate;
  }

  public async extendedValidation(localFile?: string): Promise<ServiceResponse<any>> {
    return ExtendValidationFail
  }

  public async validate(ops: ValidateOptions): Promise<ServiceResponse<any>> {
    const capabilities = await this.findCapabilities();
    const hooks = ops.skipHooksValidation ? ValidationSkipped : await this.findHooks();
    const dependencies = await this.findDependencies();
    const lookups = await this.findLookups();
    const releaseObjs = await this.findReleases();

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
    } else {
      response.body = "Addon pre-validation failed, reasons listed below: "
    }
    if (!capabilities.success) {
      response = {
        success: false,
        body: response.body + "\n" + "  * Capabilities detected.",
        error: {
          input: response.error?.input + " " + capabilities.error?.input!,
        }
      }
    }
    if (!hooks.success) {
      response = {
        success: false,
        body: response.body + "\n" + "  * Hooks detected.",
        error: {
          input: response.error?.input + " " + hooks.error?.input!,
        }
      }
    }
    if (!dependencies.success) {
      response = {
        success: false,
        body: response.body + "\n" + "  * Dependencies detected.",
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

    if (capabilities.stdout === "") {
      return SuccessResponse
    } else {
      return  {
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
  }

  private async findHooks(): Promise<ServiceResponse<string>> {
    const hooks = spawnSync('grep', ['-Rile', '"helm.sh/hook"', this.toValidate], {shell: true, encoding: "utf-8"});

    if (hooks.stdout === "") {
      return SuccessResponse
    } else {
      return {
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
      return SuccessResponse
    } else {
      return {
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
  }

  private async findLookups(): Promise<ServiceResponse<string>> {
    const grepLookups = spawnSync('grep', ['-Rile', '"{{\s*-\s*lookup\s*\(\s*"([^"]+)"\s*,\s*"([^"]+)"\s*-\s*}}"', this.toValidate], {shell: true, encoding: "utf-8"});

    if (grepLookups.stdout === "") {
      return SuccessResponse
    } else {
      return {
        success: false,
        body: "Unsupported system Lookups are used in chart.",
        error: {
          input: grepLookups.stdout,
          options: {
            code: "E504",
            exit: 1
          }
        }
      }
    }
  }

  private async findReleases(): Promise<ServiceResponse<string>> {
    const grepReleases = spawnSync('grep',{ shell: true, encoding: "utf-8" });

    if (grepReleases.stdout === "") {
      return SuccessResponse
    } else {
      return {
        success: false,
        body: "Unsupported Releases are used in chart.",
        error: {
          input: grepReleases.stdout,
          options: {
            code: "E505",
            exit: 1
          }
        }
      }
    }
  }
}
