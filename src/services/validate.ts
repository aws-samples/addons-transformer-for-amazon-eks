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
  body:'Extend validation to be implemented; FAIL',
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
    return ExtendValidationSuccess
  }

  public async validate(ops: ValidateOptions): Promise<ServiceResponse<any>> {
    const capabilities = await this.findCapabilities();
    const hooks = ops.skipHooksValidation ? ValidationSkipped : await this.findHooks();
    const dependencies = await this.findDependencies();
    const unsupportedReleaseObjects =  await this.findUnsupportedReleaseObject(ops.skipReleaseService!);

    const allValidation = [capabilities, hooks, dependencies, unsupportedReleaseObjects]
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

    if (allValidation.every(validation=> validation.success)) {
      response = {
        success: true,
        body: "Addon pre-validation complete"
      }
      return response;
    }

    // Failure scenarios:
    response.body = "Addon pre-validation failed, reasons listed below: "
    allValidation
        .filter(validation=>!validation.success) // per each one of the failures
        .map(validation=> {
          response = {
            success: false,
            body: `${response.body} \n  * ${validation.body}`,
            error: {
              input: `${response.error?.input}  ${validation.error?.input!}`,
            }
          }
        })

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

  private async findUnsupportedReleaseObject(skipReleaseService: boolean): Promise<ServiceResponse<string>> {
    // beta guide 6.1.b) All Release objects (except .Name and .Namespace) are not supported
    const unsupportedReleaseObjectsRegex = skipReleaseService ?
        "'.Release.[Name|Namespace|Service]'":
        "'.Release.[Name|Namespace]'";

    const allReleaseObjects = spawnSync('grep', ['-r', '.Release.', this.toValidate], {shell: true, encoding: "utf-8"});
    const unsupportedReleaseObjects = spawnSync('grep', ['-v', unsupportedReleaseObjectsRegex, this.toValidate], {shell: true, encoding: "utf-8", input: allReleaseObjects.stdout});

    if (unsupportedReleaseObjects.stdout === "") {
      return SuccessResponse
    } else {
      return {
        success: false,
        body: "Unsupported release objects are used in chart.",
        error: {
          input: 'unsupportedReleaseObjects.stdout',
          options: {
            code: "E504",
            exit: 1
          }
        }
      }
    }
  }
}
