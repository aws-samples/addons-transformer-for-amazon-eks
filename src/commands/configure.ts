import { Command, Flags } from '@oclif/core';

export default class Configure extends Command {

  static description = `
    Extracts information from the environment to populate information required for the Sleek CLI to function. If
    certain information is not found, prompts the user for it and asks them to validate the information extracted from 
    the environment.
    
    This information is stored ~/.sleek/config.json
    
    The CLI requires the following:
      * AWS Region - can be extracted from the env
      * Marketplace AWS Account ID - can be extracted from the env
      * Addon Name - requires user input
      * Addon Version - requires user input
      * Addon Helm Url - requires user input
      * Deployment Namespace - requires user input
      
    Each of these can be passed as flags to this command with the following flags:
      * --region
      * --marketplace_id
      * --addon_name
      * --addon_version 
      * --helm_url
      * --namespace
  `

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    addonName: Flags.string({description: 'Name of the addon'}),
    addonVersion: Flags.string({description: 'Version of the addon'}),
    helmUrl: Flags.string({description: 'Helm URL of the addon'}),
    marketplaceId: Flags.string({description: 'Marketplace AWS Account ID'}),
    namespace: Flags.string({description: 'Namespace of the addon'}),
    region: Flags.string({description: 'AWS Region'}),
  }

  static summary = "Sets up the Sleek CLI to work with a given helm chart"

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Configure)

    const name = flags.name ?? 'world'
    this.log(`hello ${name} from /Users/vshardul/source/aws-sleek-transformer-refactor/src/commands/configure.ts`)
    if (args.file && flags.force) {
      this.log(`you input --force and --file: ${args.file}`)
    }
  }
}
