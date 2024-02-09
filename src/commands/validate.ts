import {Args, Flags} from '@oclif/core';
import {SleekCommand} from "../sleek-command.js";
import ChartValidatorService from "../services/validate.js";
import HelmManagerService from "../services/helm.js";
import fs from "node:fs";
import SchemaValidationService from "../services/schemaValidation.js";
import {AddonData, AllEksSupportedKubernetesVersions, IssueData} from "../types/issue.js";
import {getChartNameFromUrl} from "../utils.js";

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
    // todo check Flags.url type
    file: Flags.string({description: "Path to add-on input file", exclusive: ['helmUrl'], char:'f'}), // or file or URL, full or bits
    directory: Flags.string({description: "Path to the addon folder", hidden: true, char:'d', exclusive: ['file', 'helmUrl']}),  // internal and for partner users who would like to test against their local code
    helmUrl: Flags.string({description: "Fully qualified URL of the Repo", exclusive: ['file']}),  // fully qualified URL of helm repo
    helmRepo: Flags.string({description: "Helm repo of the addon", exclusive: ['file', 'helmUrl'], char:'r'}),  // construct it piecemeal
    protocol: Flags.string({description: "Protocol of the helm hosting to use", exclusive: ['file', 'helmUrl'], char:'p'}),
    version: Flags.string({description: "Version of the addon to validate", exclusive: ['file'], char:'v'}),
    addonName: Flags.string({description: "Name of the addon"}),
    addonNamespace: Flags.string({description: "Add-on namespace",char:'n'}),
    extended: Flags.boolean({description: "Run extended validation", hidden: true, char:'e'}), // triggers security and extended checks. NEEDS THE CONTAINER IMAGE FOR THE ADDON
    skipHooks: Flags.boolean({description: "Skip helm hooks validation", default:false}),
    skipReleaseService: Flags.boolean({description: "Skip .Release.Service occurrences", default:false}),
  }

  static summary = "Validates the addon after pulling it from the helm repository.";

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Validate);

    // if helmURL is given, download the chart then validate
    // if file is given, validate based on the path
    // else, raise error stating one or the other arg/flag should be provided
    let repoProtocol, repoUrl, chartName, versionTag, addonName;
    // uncomment for debugging purposes
    // this.log('---')
    // this.log(`>> args: ${JSON.stringify(args)}`)
    // this.log(`>> flags: ${JSON.stringify(flags)}`)
    // this.log('---')
    if (flags.addonName) {
      addonName = flags.addonName;
    }
    let skipHooksValidation = flags.skipHooks;
    let skipReleaseService = flags.skipReleaseService;
    let addonData: AddonData | undefined = undefined;
    if (args.helmUrl || flags.helmUrl) {
      // JD decompose url, pull  and validate
      const repoUrlInput = args.helmUrl || flags.helmUrl;
      this.log(`Validating chart from url: ${repoUrlInput}`)
      repoProtocol = this.getProtocolFromFullQualifiedUrl(repoUrlInput!);
      repoUrl = this.getRepoFromFullChartUri(repoUrlInput!).substring(repoProtocol.length+3); // 3 == '://'.length
      chartName = getChartNameFromUrl(repoUrl);
      versionTag = this.getVersionTagFromChartUri(repoUrlInput!);
    } else if (
      (args.helmUrl || flags.helmUrl) && (flags.helmRepo || flags.protocol || flags.version) || // base url + flags to override // todo
      (flags.helmRepo && flags.protocol && flags.version) // all the url bits
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
      const schemaValidator = new SchemaValidationService(this);
      const data = await schemaValidator.validateInputFileSchema(fileContents);
      // get url
      const inputDataParsed = data.body as IssueData;
      addonData = inputDataParsed.addon;
      repoProtocol = addonData.helmChartUrlProtocol;
      repoUrl = this.getRepoFromFullChartUri(addonData.helmChartUrl);
      chartName = getChartNameFromUrl(repoUrl);
      versionTag = this.getVersionTagFromChartUri(addonData.helmChartUrl);
      addonName = inputDataParsed.addon.name;
      skipHooksValidation =  inputDataParsed.chartAutoCorrection?.hooks;
      skipReleaseService =  inputDataParsed.chartAutoCorrection?.releaseService;
    } else if(flags.directory){
      this.log(`Validating chart from input directory ${flags.directory}`)
    } else {
      this.error("Either a Helm URL or a file path should be provided");
    }

    const helmManager = new HelmManagerService(this);
    const chartPath = !! flags.directory ?
        flags.directory:
        `${await helmManager.pullAndUnzipChart(repoUrl!, repoProtocol!, versionTag!, addonName)}/${chartName}`;

    // addonData is initialized when reading from the input yaml; when using flags the parameters are inferred
    if (!addonData) {
      addonData = {
          helmChartUrl: `${repoProtocol}://${repoUrl}:${versionTag}`,
          helmChartUrlProtocol: repoProtocol!,
          kubernetesVersion: AllEksSupportedKubernetesVersions,
          name: addonName!,
          namespace: flags.addonNamespace || 'test-namespace',
          version: versionTag!
      }
    }
    const validatorService = new ChartValidatorService(this, chartPath, addonData!);
    const validatorServiceResp = await validatorService.validate({skipHooksValidation, skipReleaseService});

    this.log(validatorServiceResp.body);
    if(!validatorServiceResp.success){
      this.error(validatorServiceResp.error?.input!, validatorServiceResp.error?.options )
    }

    if (flags.extended) {
      const extendedValidatorServiceResp = await validatorService.extendedValidation(flags.file);
      this.log(extendedValidatorServiceResp.body);
      if(!extendedValidatorServiceResp.success){
        this.error(extendedValidatorServiceResp.error?.input!, extendedValidatorServiceResp.error?.options )
      }
    }
  }

  private getProtocolFromFullQualifiedUrl(helmChartUrl: string) {
    return helmChartUrl?.substring(0,helmChartUrl?.indexOf(':'))
  }

  private getRepoFromFullChartUri(helmChartUrl: string) {
    return helmChartUrl.substring(0, helmChartUrl.lastIndexOf(':'));
  }

  private getVersionTagFromChartUri(helmChartUrl: string) {
    return helmChartUrl.lastIndexOf(':') ? `${helmChartUrl.substring(helmChartUrl.lastIndexOf(':') + 1)}` : '';
  }
}
