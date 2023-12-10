import * as path from "path";
import {Flags} from '@oclif/core';
import select from "@inquirer/select";
import {SleekCommand} from "../sleek-command.js";
import {execSync, spawnSync} from "child_process";
import {destructureAddonKey, getAddonKey, getCurrentAddons} from "../utils.js";

export default class Validate extends SleekCommand {
  static description = `
    This performs pre-launch validations of the partner software on compatibility with Sleek guidelines, covering static
    and dynamic (deployment/runtime) aspects.
  
    Runs the static analysis to find occurrences of:
      * .Capabilities
      * helm.sh/hook
    
    This command requires the "configure" command to have been run, it needs:
      * Helm URL
    to be configured correctly.
    
    It will perform a static validation on the device and then give you the option to submit it to the marketplace for
    runtime and further validation before it can be included in the EKS Console marketplace. 
  `

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    addonName: Flags.string({description: "Name of the addon to validate"}),
    addonVersion: Flags.string({description: "Version of the addon to validate"}),
  }

  static summary = "Validates a given addon from the configuration provided through the 'configure' command";

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Validate);

    let addonKey;

    // if addon name and version are not provided, prompt the user
    if (!flags.addonName || !flags.addonVersion) {
      // fetch pre-existing configs from  ~/.sleek/config.json
      const currentConf = this.configuration;
      const addons = getCurrentAddons(currentConf);

      const selected: { name: string,  version: string } = await select({
        message: 'Which addon would you like to validate the configuration for?',
        choices: addons
      });

      addonKey = selected.name;
    } else {
      addonKey = getAddonKey(flags.addonName, flags.addonVersion);
    }
    const chart = path.resolve(await this.pullHelmChart(addonKey));

    // turns out using grep is the best way to do it lmao
    // rip all the Windows users
    const findCapabilities = spawnSync('grep', ['-Rile', '".Capabilities"', chart], { shell: true });
    const findHooks = spawnSync('grep', ['-Rile', '"helm.sh/hook"', chart], { shell: true });

    if (findCapabilities.stdout.toString() == "" && findHooks.stdout.toString() == "") {
      this.log('No occurrences of .Capabilities or helm.sh/hook found in Helm chart');

      this.configuration[addonKey].validated = false;
    } else {
      this.log("Found .Capabilities or helm.sh/hook in helm chart.");

      this.configuration[addonKey].validated = true;
    }
  }

  private async pullHelmChart(addonKey: string): Promise<string> {
    const addonInfo = destructureAddonKey(addonKey);

    const currentConf = this.configuration;
    const currentAddon = currentConf[addonKey];

    const untarLocation = `./unzipped-${addonInfo.name}`;
    const pullCmd = `rm -rf ${untarLocation} && 
                             mkdir ${untarLocation} && 
                             helm pull ${currentAddon.helmUrl} --version ${addonInfo.version} --untar --untardir ${untarLocation}`;
    try {
      const result = execSync(pullCmd);
      this.log(result.toString());
      this.log("Helm Chart pull complete.");
    } catch (e) {
      this.error(`Helm chart pull failed with error ${e}`);
    }

    return untarLocation;
  }
}
