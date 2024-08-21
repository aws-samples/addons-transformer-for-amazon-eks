import {spawnSync} from "node:child_process";

import {SleekCommand} from "../sleek-command.js";
import {AddonData} from "../types/issue.js";
import {ServiceResponse} from "../types/service.js";
import {ValidateOptions} from "../types/validate.js";
import {BaseService} from "./base-service.js";

import {Debug} from "@oclif/core/lib/config/util.js";

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
  private debug = Debug("validator");

  private readonly name: string;
  private readonly namespace: string;
  private readonly supportedKubernetesVersions: string[];
  // this will always be a local filepath
  private readonly toValidate: string;

  constructor(commandCaller: SleekCommand, toValidate: string, addonData: AddonData) {
    super(commandCaller);
    this.toValidate = `"${toValidate}"`;
    this.name = `"${addonData.name}"`;
    this.namespace = `"${addonData.namespace}"`;
    this.supportedKubernetesVersions = addonData.kubernetesVersion!;
  }

  public async validate(ops: ValidateOptions): Promise<ServiceResponse<string>> {
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
    for (const validationResponse of allValidation
      .filter(validation => !validation.success)) {
        response = {
          success: false,
          body: `${response.body} \n  * ${validationResponse.body}`,
          error: {
            input: `${response.error?.input}  ${validationResponse.error?.input}`,
          }
        }
      }

    return response;
  }

  private async findCapabilities(): Promise<ServiceResponse<string>> {
    // create two templates, one with CRDs and the other without
    // then grep the two generated outputs to see if there's a delta in how many capabilities are found
    // if there is a delta, then there are unsupported capabilities in the chart
    // this is a bit hacky, but it works for now
    let allVersionSuccess = true;
    const errors: string[] = [];

    for (const k8sVersion of this.supportedKubernetesVersions) {
      const withCrds = this.getNoCrdsTemplateResult(k8sVersion);
      const withoutCrds = this.getTemplateResult(k8sVersion);

      const capsWithCrds = spawnSync('grep', ['-ilne', '".Capabilities"', "<<<", withCrds.stdout], {shell: true, encoding: "utf8"});
      const capsWithoutCrds = spawnSync('grep', ['-ilne', '".Capabilities"', "<<<", withoutCrds.stdout], {shell: true, encoding: "utf8"});

      if (capsWithCrds.stdout !== capsWithoutCrds.stdout) {
        allVersionSuccess = false;
        errors.push(`Unsupported system Capabilities are used in chart for Kubernetes version ${k8sVersion}.`)
      }
    }

    // success execution
    if (allVersionSuccess) {
      return SuccessResponse;
    }

    // any off the templates failed
    return {
      success: false,
      body: `.Capabilities detected for at least one Kubernetes version'`,
      error: {
        input: errors.join(''),
        options: {
          code: "E501",
          exit: 1
        }
      }
    };
  }

  private async findDependencies(): Promise<ServiceResponse<string>> {
    const grepDependencies = spawnSync('helm', ['dependency', 'list', this.toValidate], {
      shell: true,
      encoding: "utf8"
    });

    // split every line in the output
    // discard headers
    // in every subsequent line, get the output at index 1 (which is the relative path of a dependency)
    const dependencies = grepDependencies.stdout.toString()
      .split('/n')
      .slice(1)
      .map(line => line.split('/t')[1])
      .filter(Boolean);

    this.debug(`dependencies found: ${dependencies}`);

    if (dependencies.length === 0) {
      return SuccessResponse;
    }

    // check dependencies to ensure they all contain file://
    const allDepsFiles = dependencies.every(dep => dep.includes('file://'));

    return allDepsFiles ? SuccessResponse : {
        success: false,
        body: "Not all dependencies reside in the main chart.",
        error: {
          input: dependencies.toString(),
          options: {
            code: "E503",
            exit: 1
          }
        }
      };
  }

  private async findHooks(): Promise<ServiceResponse<string>> {
    const hooks = spawnSync('grep', ['-Rine', '"helm.sh/hook"', this.toValidate], {shell: true, encoding: "utf8"});

    return hooks.stdout === "" ? SuccessResponse : {
        success: false,
        body: "Unsupported system Hooks are used in chart.",
        error: {
          input: hooks.stdout,
          options: {
            code: "E502",
            exit: 1
          }
        }
      };
  }

  private async findLookups(): Promise<ServiceResponse<string>> {
    // Find any instance of "lookup" that starts with an opening parenthesis and ignore any white spaces between opening
    // and the word itself
    const grepLookup = spawnSync('grep', ['-RinE', "'\\{\\{-\\?*.*\\s*(lookup)\\s'", `"${this.toValidate}"`], {shell: true, encoding: "utf8"});

    this.debug(`grepLookup out: ${grepLookup.stdout}`);

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

  private async findUnsupportedReleaseObject(skipReleaseService: boolean): Promise<ServiceResponse<string>> {
    // beta guide 6.1.b) All Release objects (except .Name and .Namespace) are not supported
    const unsupportedReleaseObjectsRegex = skipReleaseService ?
      "'.Release.[Name|Namespace|Service]'" :
      "'.Release.[Name|Namespace]'";

    const allReleaseObjects = spawnSync('grep', ['-rn', '.Release.', this.toValidate], {shell: true, encoding: "utf8"});
    const unsupportedReleaseObjects = spawnSync('grep', ['-vn', unsupportedReleaseObjectsRegex, this.toValidate], {
      shell: true,
      encoding: "utf8",
      input: allReleaseObjects.stdout
    });

    return unsupportedReleaseObjects.stdout === "" ? SuccessResponse : {
        success: false,
        body: "Unsupported release objects are used in chart.",
        error: {
          input: unsupportedReleaseObjects.stdout,
          options: {
            code: "E504",
            exit: 1
          }
        }
      };
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
    ], {shell: true, encoding: "utf8"});
  }

  /**
   * https://helm.sh/docs/helm/helm_lint/
   * @private
   */
  private async runHelmLint(): Promise<ServiceResponse<string>> {
    const lintResult = spawnSync('helm', ['lint', ' --strict', '--with-subcharts', this.toValidate], {
      shell: true,
      encoding: "utf8"
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

    for (const k8sVersion of this.supportedKubernetesVersions) {
      const templateResult = this.getTemplateResult(k8sVersion);
      // this.log(`Templating for k8s version ${k8sVersion} ${templateResult.status===0?'successful':'errored'}`)
      if (templateResult.status !== 0) {
        allVersionSuccess = false
        errors.push(`Kubernetes version: ${k8sVersion} - ${templateResult.stderr}`)
      }
    }

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

  // eslint-disable-next-line valid-jsdoc
  /**
   * helm template <chart-name> <chart-location>
   *      --set k8version=<Kubernetes-version>
   *      --kube-version <Kubernetes-version>
   *      --namespace <addon-namespace>
   *      --skip-crds
   *      --f <any-overridden-values> TODO
   */
  private getNoCrdsTemplateResult(k8sVersion: string) {
    return spawnSync('helm', [
      'template',
      this.name,
      this.toValidate,
      `--set k8version=${k8sVersion}`,
      '--kube-version', k8sVersion,
      '--namespace', this.namespace,
      '--skip-crds',
    ], {shell: true, encoding: "utf8"});
  }
}
