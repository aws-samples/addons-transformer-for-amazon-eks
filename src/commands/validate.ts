import {Args, Flags} from '@oclif/core';
import {SleekCommand} from "../sleek-command.js";
import ChartValidatorService from "../services/validate.js";
import HelmManagerService from "../services/helm.js";
import fs from "node:fs";
import SchemaValidationService from "../services/schemaValidation.js";
import {IssueData} from "../types/issue.js";
import * as url from "url";

export default class Validate extends SleekCommand {
  static description = `
    This performs pre-launch validations of the partner software on compatibility with Sleek guidelines, covering static
    and dynamic (deployment/runtime) aspects.
  
    Runs the static analysis to find occurrences of:
      * .Capabilities
      * helm.sh/hook
      * external helm dependencies
    
    It will perform a static validation on the device and then give you the option to submit it to the marketplace for
    runtime and further validation before it can be included in the EKS Console marketplace.
    
    The command can accept two different formats of inputs:
      * Fully qualified Helm URL to download
      * Deconstructed URL that requires Protocol, Repo, and Version to pull
  `

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static args = {
    helmUrl: Args.string(
      {
        required: false,
        description: "Fully qualified Helm URL of the addon"
      }
    ),
  }

  static flags = {
    // todo check exclusive flags
    file: Flags.string({description: "Path to add-on input file", exclusive: ['helmUrl']}), // or file or URL, full or bits
    helmUrl: Flags.string({description: "Fully qualified URL of the Repo", exclusive: ['file']}),  // fully qualified URL of helm repo
    helmRepo: Flags.string({description: "Helm repo of the addon", exclusive: ['file', 'helmUrl']}),  // construct it piecemeal
    protocol: Flags.string({description: "Protocol of the helm hosting to use", exclusive: ['file', 'helmUrl']}),
    version: Flags.string({description: "Version of the addon to validate", exclusive: ['file']}),
    addonName: Flags.string({description: "Name of the addon"}),
    extended: Flags.boolean({description: "Run extended validation", hidden: true}), // triggers security and extended checks. NEEDS THE CONTAINER IMAGE FOR THE ADDON
    // todo check Flags.url type
  }

  static summary = "Validates the addon after pulling it from the helm repository.";

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Validate);

    // if helmURL is given, download the chart then validate
    // if file is given, validate based on the path
    // else, raise error stating one or the other arg/flag should be provided
    let repoProtocol, repoUrl, versionTag, addonName;

    if (flags.addonName) {
      addonName = flags.addonName;
    }
    if (args.helmUrl || flags.helmUrl) {
      // JD decompose url, pull  and validate
      repoUrl = args.helmUrl || flags.helmUrl;
      const {protocol, host, port} = url.parse(repoUrl || ""); // todo: validate this works as expected

      repoProtocol = protocol;
      versionTag = port; // will never be falsy because the flag or arg validation
      repoUrl = host; // ensure it works
    } else if (
      (args.helmUrl || flags.helmUrl) && (flags.helmRepo || flags.protocol || flags.version) || // base url + flags to override
      (flags.helmRepo && flags.protocol && flags.version) // all the url bits
    ) {
      // JD get the base url from
      // todo

    } else if (flags.file) {
      // JD
      // schema validation
      const filePath = flags.file;
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const schemaValidator = new SchemaValidationService(this);
      const data = await schemaValidator.validateInputFileSchema(fileContents);
      const inputDataParsed = data.body as IssueData;
      // get url
      const addonData = inputDataParsed.addon;
      repoUrl = addonData.helmChartUrl;
      repoProtocol = addonData.helmChartUrlProtocol;
      versionTag = this.getVersionTagFromUrl(addonData.helmChartUrl);
      // pull and validate
    } else {
      this.error("Either a Helm URL or a file path should be provided");
    }

    const helmManager = new HelmManagerService(this);

    const chartPath = await helmManager.pullAndUnzipChart(repoUrl!, repoProtocol!, versionTag!, addonName);

    // const chartPath = await helmManager.pullAndUnzipChartV2(addonData.name, chartTag, repoUrl, 'oci')
    // const charPath = await pullHelmChart(addonData.name, chartTag, repo)
    const validatorService = new ChartValidatorService(this, chartPath);
    const validatorServiceResp = await validatorService.validate();

    this.log(validatorServiceResp.body);

    if (flags.extended) {
      await validatorService.extendedValidation(flags.file);
    }
  }

  private getVersionTagFromUrl(helmChartUrl: string) {
    return helmChartUrl.lastIndexOf(':') ? `${helmChartUrl.substring(helmChartUrl.lastIndexOf(':') + 1)}` : '';
  }

  private async validateFile(filePath: string): Promise<void> {
    const validator = new ChartValidatorService(this, filePath);
    await validator.validate();
  }

  private async validateHelmChart(helmUrl: string, addonName: string): Promise<void> {
    const helmManager = new HelmManagerService(this);

    const untarLocation = await helmManager.pullAndUnzipChart(helmUrl, addonName);
    const validator = new ChartValidatorService(this, untarLocation);
    await validator.validate();
  }
}
