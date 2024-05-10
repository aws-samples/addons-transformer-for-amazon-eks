import fs from "node:fs";

import ValidateOpt from "../commandOpts/validate.js";
import HelmManagerService from "../services/helm.js";
import SchemaValidationService from "../services/schemaValidation.js";
import ChartValidatorService from "../services/validate.js";
import {SleekCommand} from "../sleek-command.js";
import {AddonData, AllEksSupportedKubernetesVersions, IssueData} from "../types/issue.js";
import {
  getChartNameFromUrl,
  getProtocolFromFullQualifiedUrl,
  getRepoFromFullChartUri,
  getVersionTagFromChartUri
} from "../utils.js";

export default class Validate extends SleekCommand {
  static args = ValidateOpt.args;
  static description = ValidateOpt.description;
  static examples = ValidateOpt.examples;
  static flags = ValidateOpt.flags;
  static summary = ValidateOpt.summary;

  // eslint-disable-next-line complexity
  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Validate);

    // if helmURL is given, download the chart then validate
    // if file is given, validate based on the path
    // else, raise error stating one or the other arg/flag should be provided
    let repoProtocol; let repoUrl; let chartName; let versionTag; let addonName;
    let skipHooksValidation = flags.skipHooks;
    // eslint-disable-next-line prefer-destructuring
    let skipReleaseService = flags.skipReleaseService;
    let addonData: AddonData | undefined;

    // uncomment for debugging purposes
    // this.log('---')
    // this.log(`>> args: ${JSON.stringify(args)}`)
    // this.log(`>> flags: ${JSON.stringify(flags)}`)
    // this.log('---')
    if (flags.addonName) {
      addonName = flags.addonName;
    }

    if (args.helmUrl || flags.helmUrl) {
      // JD decompose url, pull  and validate
      const repoUrlInput = args.helmUrl || flags.helmUrl;

      this.log(`Validating chart from url: ${repoUrlInput}`)
      repoProtocol = getProtocolFromFullQualifiedUrl(repoUrlInput!);
      repoUrl = getRepoFromFullChartUri(repoUrlInput!).slice(Math.max(0, repoProtocol.length + 3)); // 3 == '://'.length

      chartName = getChartNameFromUrl(repoUrl);
      versionTag = getVersionTagFromChartUri(repoUrlInput!);
    } else if (
      // eslint-disable-next-line no-dupe-else-if
      (args.helmUrl || flags.helmUrl) && (flags.helmRepo || flags.protocol || flags.version) // base url + flags to override // todo
    ) {
      const repoUrlInput = args.helmUrl || flags.helmUrl;

      repoProtocol = flags.protocol || getProtocolFromFullQualifiedUrl(repoUrlInput!);
      repoUrl = flags.helmRepo || getRepoFromFullChartUri(repoUrlInput!).slice(Math.max(0, repoProtocol.length + 3));
      versionTag = flags.version || getVersionTagFromChartUri(repoUrlInput!);
    } else if (
      flags.helmRepo && flags.protocol && flags.version // all the url bits
    ) {
      repoProtocol = flags.protocol;
      repoUrl = flags.helmRepo;
      chartName = getChartNameFromUrl(repoUrl!);
      versionTag = flags.version;
      this.log(`Validating chart from flags: ${repoProtocol}://${repoUrl}:${versionTag}`)
    } else if (flags.file) {
      const filePath = flags.file;
      this.log(`Validating chart from input file ${filePath}`)
      // schema validation
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const schemaValidator = new SchemaValidationService(this, flags.issueSchemaUrl);
      const data = await schemaValidator.validateInputFileSchema(fileContents);
      // get url
      const inputDataParsed = data.body as IssueData;
      addonData = inputDataParsed.addon;
      repoProtocol = addonData.helmChartUrlProtocol;
      repoUrl = getRepoFromFullChartUri(addonData.helmChartUrl);
      chartName = getChartNameFromUrl(repoUrl);
      versionTag = getVersionTagFromChartUri(addonData.helmChartUrl);
      addonName = inputDataParsed.addon.name;
      skipHooksValidation = inputDataParsed.chartAutoCorrection?.hooks;
      skipReleaseService = inputDataParsed.chartAutoCorrection?.releaseService;
    } else if (flags.directory) {
      this.log(`Validating chart from input directory ${flags.directory}`)
    } else {
      this.error("Parameters not valid. Please run 'validate --help' for see valid options");
    }

    // verify that the things are populated
    if (!flags.directory) {
      let errorMessage = '';
      if (!repoProtocol) {
        errorMessage = `${errorMessage} protocol is required`;
      }

      if (!repoUrl) {
        errorMessage = `${errorMessage} repo is required`;
      }

      if (!chartName) {
        errorMessage = `${errorMessage} Chart name is required`;
      }

      if (!versionTag) {
        errorMessage = `${errorMessage} version tag is required`;
      }

      if (errorMessage !== '') {
        this.error(`Parameters are not valid: ${errorMessage}`);
      }
    }


    const helmManager = new HelmManagerService(this);
    const chartPath = flags.directory ?? `${await helmManager.pullAndUnzipChart(repoUrl!, repoProtocol!, versionTag!, addonName)}/${chartName}`;

    // addonData is initialized when reading from the input yaml; when using flags the parameters are inferred
    addonData ||= {
      helmChartUrl: flags.directory ? 'local-testing' : `${repoProtocol}://${repoUrl}:${versionTag}`,
      helmChartUrlProtocol: flags.directory ? 'local-testing' : repoProtocol!,
      kubernetesVersion: flags.k8sVersions?.split(',') || AllEksSupportedKubernetesVersions,
      name: flags.directory ? 'local-testing' : addonName!,
      namespace: flags.addonNamespace || 'test-namespace',
      version: flags.directory ? 'local-testing' : versionTag!
    };


    const validatorService = new ChartValidatorService(this, chartPath, addonData!);
    const validatorServiceResp = await validatorService.validate({skipHooksValidation, skipReleaseService});

    if (validatorServiceResp === undefined) {
      this.error('Error validating service');
    } else if (validatorServiceResp.success) {
      this.log(validatorServiceResp.body);
      this.log('Validation successful');
    } else if (validatorServiceResp.error !== undefined) {
      this.error(validatorServiceResp.error?.input, validatorServiceResp.error?.options)
    }
  }
}
