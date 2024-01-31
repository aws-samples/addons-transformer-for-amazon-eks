import {SleekCommand} from "../sleek-command.js";

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
  }

  static summary = "Submit the addon to the AWS marketplace"

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Submit);

    // TODO: Figure out the submit command

    // figure out how to submit to the marketplace
  }
}
