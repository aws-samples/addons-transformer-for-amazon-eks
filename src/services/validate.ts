import {spawnSync} from "child_process";
import {BaseService} from "./base-service.js";
import {ServiceResponse} from "../types/service.js";
import {SleekCommand} from "../sleek-command.js";
import {ValidateOptions} from "../types/validate.js";
import {AddonData} from "../types/issue.js";

export const SuccessResponse: ServiceResponse<string> = {
  success: true,
};

export const ValidationSkipped: ServiceResponse<string> = {
  success: true,
  body: 'validation skipped'
};
export const ExtendValidationSuccess: ServiceResponse<string> = {
  success: true,
  body: 'Extend validation to be implemented; SUCCESS'
};
export const ExtendValidationFail: ServiceResponse<string> = {
  success: false,
  body: 'Extend validation to be implemented; FAIL',
  error: {
    input: 'Extend validation to be implemented; FAIL',
    options: {
      exit: 2,
    }
  }
};

export default class ChartValidatorService extends BaseService {
  // this will always be a local filepath
  private readonly toValidate: string;
  private readonly supportedKubernetesVersions: string[];
  private readonly name: string;
  private readonly namespace: string;
  constructor(commandCaller: SleekCommand, toValidate: string, addonData: AddonData) {
    super(commandCaller);
    this.toValidate = `"${toValidate}"`;
    this.name = `"${addonData.name}"`;
    this.namespace = `"${addonData.namespace}"`;
    this.supportedKubernetesVersions = addonData.kubernetesVersion;
  }

  public async extendedValidation(_localFile?: string): Promise<ServiceResponse<any>> {
    return ExtendValidationSuccess
  }

  public async validate(ops: ValidateOptions): Promise<ServiceResponse<any>> {
    const lintResult = await this.runHelmLint();
    const templateResult = await this.runHelmTemplate();
    const capabilities = await this.findCapabilities();
    const hooks = ops.skipHooksValidation ? ValidationSkipped : await this.findHooks();
    const dependencies = await this.findDependencies();
    const unsupportedReleaseObjects = await this.findUnsupportedReleaseObject(ops.skipReleaseService!);
    const lookups = await this.findLookups();

    const allValidation = [
      lintResult,
      templateResult,
      capabilities,
      hooks,
      dependencies,
      unsupportedReleaseObjects,
      lookups,
    ]
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

    if (allValidation.every(validation => validation.success)) {
      response = {
        success: true,
        body: "Addon pre-validation complete"
      }
      return response;
    }

    // Failure scenarios:
    response.body = "Addon pre-validation failed, reasons listed below: "
    allValidation
      .filter(validation => !validation.success) // per each one of the failures
      .map(validation => {
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
    const capabilities = spawnSync('grep', ['-Rilen', '".Capabilities"', this.toValidate], {
      shell: true,
      encoding: "utf-8"
    });

    if (capabilities.stdout === "") {
      return SuccessResponse
    } else {
      return {
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
    const hooks = spawnSync('grep', ['-Rilen', '"helm.sh/hook"', this.toValidate], {shell: true, encoding: "utf-8"});

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
      "'.Release.[Name|Namespace|Service]'" :
      "'.Release.[Name|Namespace]'";

    const allReleaseObjects = spawnSync('grep', ['-rn', '.Release.', this.toValidate], {shell: true, encoding: "utf-8"});
    const unsupportedReleaseObjects = spawnSync('grep', ['-vn', unsupportedReleaseObjectsRegex, this.toValidate], {
      shell: true,
      encoding: "utf-8",
      input: allReleaseObjects.stdout
    });

    if (unsupportedReleaseObjects.stdout === "") {
      return SuccessResponse
    } else {
      return {
        success: false,
        body: "Unsupported release objects are used in chart.",
        error: {
          input: unsupportedReleaseObjects.stdout,
          options: {
            code: "E504",
            exit: 1
          }
        }
      }
    }
  }

  /**
   * https://helm.sh/docs/helm/helm_lint/
   * @private
   */
  private async runHelmLint(): Promise<ServiceResponse<string>> {
    const lintResult = spawnSync('helm', ['lint', ' --strict', '--with-subcharts', this.toValidate], {
      shell: true,
      encoding: "utf-8"
    });

    // success execution
    if (lintResult.status === 0) {
      return SuccessResponse
    }

    // lint issues found
    return {
      success: false,
      body: `Helm linter found errors running 'helm lint --strict --with-subcharts ${this.toValidate}'`,
      error: {
        input: lintResult.stdout,
        options: {
          code: "E505",
          exit: 1
        }
      }
    }
  }

  /**
   * https://helm.sh/docs/helm/helm_template/
   * @private
   */
  private async runHelmTemplate(): Promise<ServiceResponse<string>> {
    const errors: string[] = [];
    let allVersionSuccess = true;

    this.supportedKubernetesVersions.map(k8sVersion => {
      const templateResult = this.getTemplateResult(k8sVersion);
      // this.log(`Templating for k8s version ${k8sVersion} ${templateResult.status===0?'successful':'errored'}`)
      if (templateResult.status != 0) {
        allVersionSuccess = false
        errors.push(`Kubernetes version: ${k8sVersion} - ${templateResult.stderr}`)
      }
    })

    // success execution
    if (allVersionSuccess) {
      return SuccessResponse;
    }

    // any off the templates failed
    return {
      success: false,
      body: `Helm templated failed for at least one kubernetes version'`,
      error: {
        input: errors.join(''),
        options: {
          code: "E506",
          exit: 1
        }
      }
    }
  }

  private async findLookups(): Promise<ServiceResponse<string>> {
    // Find any instance of "lookup" that starts with an opening parenthesis and ignore any white spaces between opening
    // and the word itself
    const grepLookup = spawnSync('grep', ['-Rilen', '"(\s*lookup"', `"${this.toValidate}"`], {shell: true, encoding: "utf-8"});

    if (grepLookup.stdout === "") {
      return SuccessResponse;
    }

    return {
      success: false,
      body: "Helm charts use lookup functions",
      error: {
        input: "Lookup functions not permitted",
        options: {
          code: "E507",
          exit: 1
        }
      }
    }
  }

  /**
   *
   *  helm template <chart-name> <chart-location>
   *      --set k8version=<Kubernetes-version>
   *      --kube-version <Kubernetes-version>
   *      --namespace <addon-namespace>
   *      --include-crds
   *      --no-hooks
   *      --f <any-overridden-values> TODO
   *
   * @param k8sVersion
   * @private
   */
  private getTemplateResult(k8sVersion: string) {
    return spawnSync('helm', [
      'template',
      this.name,
      this.toValidate,
      `--set k8version=${k8sVersion}`,
      '--kube-version', k8sVersion,
      '--namespace', this.namespace,
      '--include-crds',
      '--no-hooks',
    ], {shell: true, encoding: "utf-8"});
  }
}
