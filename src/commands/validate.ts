import * as path from "path";
import {Args, Flags} from '@oclif/core';
import select from "@inquirer/select";
import {SleekCommand} from "../sleek-command.js";
import {execSync, spawnSync} from "child_process";
import ChartValidatorService from "../services/validate.js";
import HelmManagerService from "../services/helm.js";

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
  `

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static args = {
    helmUrl: Args.string(
      {
        required: false,
        description: "Helm URL of the addon"
      }
    ),
    file: Args.string(
      {
        required: false,
        description: "Path to add-on input file"
      }
    )
  }

  static flags = {
    file: Flags.string({description: "Path to add-on input file"}),
    helmUrl: Flags.string({description: "Helm URL of the addon"}),
    addonName: Flags.string({description: "Name of the addon"}),
  }

  static summary = "Validates a given addon from the configuration provided through the 'configure' command";

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Validate);

    // if helmURL is given, download the chart then validate
    // if file is given, validate based on the path
    // else, raise error stating one or the other arg/flag should be provided
    if (args.helmUrl) {
      await this.validateHelmChart(args.helmUrl, flags.addonName!);
    } else if (flags.file) {
      await this.validateFile(flags.file);
    } else {
      this.error("Either a Helm URL or a file path should be provided");
    }
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
