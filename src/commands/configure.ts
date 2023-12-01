import {Command, Flags} from '@oclif/core';
import {input, confirm} from '@inquirer/prompts';
import select, { Separator } from '@inquirer/select';
import * as config from 'config';

export default class Configure extends Command {

  static description = `
    Extracts information from the environment to populate information required for the Sleek CLI to function. If
    certain information is not found, prompts the user for it and asks them to validate the information extracted from 
    the environment.
    
    This information is stored ~/.sleek/config.json
    Each of these configurations can be edited by passing the exact addon name and version.
    
    The CLI requires the following:
      * AWS Region
      * Marketplace AWS Account ID
      * Addon Name
      * Addon Version
      * Addon Helm Url
      * Deployment Namespace
      
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
    const {args, flags} = await this.parse(Configure);

    // check if any flags are added
    // TODO: Validate this works
    if (Object.keys(flags).length === 0) {
      // Immediately launch interactive session with inquirer

      // check if the want to edit an existing addon
      const editExistingAddon = await confirm({message: 'Do you want to edit an existing AddOn?'});
      if (editExistingAddon) {
        // do nothing.
      } else {
        // edit workflow in here

        // fetch pre-existing configs from  ~/.sleek/config.json
        let currentConf;

        // const config = await select({
        //   message: 'Which addon would you like to change the configuration for?',
        //
        // })
      }
    }

    // create a new addon to validate
    const addonConfig = {
      addonName: await input({message: 'What is the AddOn Name?'}),
      addonVersion: await input({message: 'What is the AddOn Version?'}),
      helmUrl: await input({
        message: 'What is the Helm URL?', validate: input => {
          return this.isValidUrl(input)
        }
      }),
      marketplaceId: await input({message: 'What is the Marketplace AWS Account ID?'}),
      namespace: await input({
        message: 'What is the Namespace?', validate: input => {
          return this.isValidNamespace(input)
        }
      }),
      region: await input({
        message: 'What is the AWS Region?', validate: input => {
          return this.isValidRegion(input)
        }
      }),
    }
  }

  private isValidRegion(region: string): boolean {
    // AWS regions must:
    // - Start with a letter
    // - Contain only letters, numbers, hyphens
    // - Be between 3-25 chars

    const regionRegex = /^[a-z][a-z0-9-]{1,23}[a-z0-9]$/;

    return regionRegex.test(region);

  }

  private isValidNamespace(namespace: string): boolean {
    // Namespace name must be no longer than 63 characters
    if (namespace.length > 63) {
      return false;
    }

    // Namespaces can only contain lowercase alphanumeric characters or '-'
    const namespaceRegex = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;

    if (!namespaceRegex.test(namespace)) {
      return false;
    }

    // Namespaces cannot start or end with '-'
    return !(namespace[0] === '-' || namespace[namespace.length - 1] === '-');
  }


  private isValidUrl(input: string): boolean {
    try {
      new URL(input);
      return URL.canParse(input);
    } catch (_) {
      return false;
    }
  }
}
