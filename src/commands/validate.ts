import { Command, Flags } from '@oclif/core'
import {SleekCommand} from "../sleek-command.js";

export default class Validate extends SleekCommand {
  static description = `
    This performs pre-launch validations of the partner software on compatibility with Sleek guidelines, covering static
    and dynamic (deployment/runtime) aspects.
  
    Runs the static analysis to find occurrences of:
      * .Capabilities
      * helm.sh/hook
    
    This command requires the "configure" command to have been run, it needs:
      * Helm URL
      * Namespace
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
    const {args, flags} = await this.parse(Validate)

    const name = flags.name ?? 'world'
    this.log(`hello ${name} from /Users/vshardul/source/aws-sleek-transformer-refactor/src/commands/validate.ts`)
    if (args.file && flags.force) {
      this.log(`you input --force and --file: ${args.file}`)
    }
  }
}
