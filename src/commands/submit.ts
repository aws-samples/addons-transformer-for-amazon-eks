import { Flags } from '@oclif/core'
import select from "@inquirer/select";
import {SleekCommand} from "../sleek-command.js";
import {getAddonKey, getCurrentAddons} from "../utils.js";

export default class Submit extends SleekCommand {

  static description = `
    Sends the selected addon, version to the marketplace for final submission and upload it to Project Sleek.
    
    It reads from the addons stored in the config: ~/.sleek/config.json and presents them as options to the user to 
    submit.
    
    The CLI requires the configure command to be run before hand to ensure there are correct configurations for each of
    the addons.
    
    This command requires the following:
      * Addon Name - as used in the configure command
      * Addon Version - as used in the configure command
      
    If no flags are provided, the CLI will launch an interactive menu which let's you select which addon to submit to 
    the marketplace.
  `

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    addonName: Flags.string({description: "Name of the addon to submit"}),
    addonVersion: Flags.string({description: "Version of the addon to submit"}),
  }

  static summary = "Uses the pre-existing configurations to submit the addon to the AWS marketplace"

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Submit);

    let addonKey;

    // if addon name and version are not provided, prompt the user
    if (!flags.addonName || !flags.addonVersion) {
      // fetch pre-existing configs from  ~/.sleek/config.json
      const currentConf = this.configuration;
      const addons = getCurrentAddons(currentConf);

      const selected: { name: string,  version: string } = await select({
        message: 'Which addon would you like to submit to the marketplace?',
        choices: addons
      });
      addonKey = getAddonKey(selected.name, selected.version);
    } else {
      addonKey = getAddonKey(flags.addonName, flags.addonVersion);
    }

    // figure out how to submit to the marketplace
  }
}
