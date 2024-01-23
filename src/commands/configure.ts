import {confirm, input} from '@inquirer/prompts';
import select from '@inquirer/select';
import {Flags} from '@oclif/core';

import {SleekCommand} from "../sleek-command.js";
import {getAddonKey, getCurrentAddons} from "../utils.js";

export default class Configure extends SleekCommand {

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
    kubeVersion: Flags.string({description: 'Target Kubernetes version of the addon'}),
    marketplaceId: Flags.string({description: 'Marketplace AWS Account ID'}),
    namespace: Flags.string({description: 'Namespace of the addon'}),
    region: Flags.string({description: 'AWS Region'}),
  }

  static summary = "Sets up the Sleek CLI to work with a given helm chart"

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Configure);

    // check if any flags are not undefined
    // TODO: Validate this works
    if (Object.values(flags).every(value => value === undefined)) {
      // Immediately launch interactive session with inquirer
      // check if the want to edit an existing addon
      const editExistingAddon = await confirm({message: 'Do you want to edit an existing AddOn?'});
      if (editExistingAddon) {
        // edit workflow in here

        // fetch pre-existing configs from  ~/.sleek/config.json
        const currentConf = this.configuration;
        const addons = getCurrentAddons(currentConf);

        const selected = await select({
          choices: addons,
          message: 'Which addon would you like to change the configuration for?'
        });

        const addOnKey = getAddonKey(selected.name, selected.version);

        const toModify = {
          addonName: await input({
            default: selected.name,
            message: 'Change the AddOn Name?'
          }),
          addonVersion: await input({
            default: selected.version,
            message: 'Change the AddOn Version?'
          }),
          helmUrl: await input({
            default: currentConf[addOnKey].helmUrl,
            message: 'Change the Helm URL?',
            validate: input => this.isValidUrl(input)
          }),
          kubeVersion: await input({
            default: currentConf[addOnKey].kubeVersion,
            message: 'Change the Kubernetes Version?'
          }),
          marketplaceId: await input({
            default: currentConf[addOnKey].accId,
            message: 'Change the Marketplace AWS Account ID?'
          }),
          namespace: await input({
            default: currentConf[addOnKey].namespace,
            message: 'Change the Namespace?',
            validate: input => this.isValidNamespace(input)
          }),
          region: await input({
            default: currentConf[addOnKey].region,
            message: 'Change the AWS Region?',
            validate: input =>  this.isValidRegion(input)
          }),
        };

        this.configuration[getAddonKey(toModify.addonName, toModify.addonVersion)] = {
          accId: toModify.marketplaceId,
          helmUrl: toModify.helmUrl,
          kubeVersion: toModify.kubeVersion,
          namespace: toModify.namespace,
          region: toModify.region,
          validated: false
        };

        delete this.configuration[addOnKey];

        this.updateConfig();

        return;
      }

      // create a new addon config
      const addonConfig = {
        addonName: await input({message: 'What is the AddOn Name?'}),
        addonVersion: await input({message: 'What is the AddOn Version?'}),
        helmUrl: await input({
          message: 'What is the Helm URL?', validate: input => this.isValidUrl(input)
        }),
        kubeVersion: await input({message: 'What is the targeted Kubernetes Version?'}),
        marketplaceId: await input({message: 'What is the Marketplace AWS Account ID?'}),
        namespace: await input({
          message: 'What is the Namespace?', validate: input => this.isValidNamespace(input)
        }),
        region: await input({
          message: 'What is the AWS Region?', validate: input => this.isValidRegion(input)
        }),
      };

      this.configuration[getAddonKey(addonConfig.addonName, addonConfig.addonVersion)] = {
        accId: addonConfig.marketplaceId,
        helmUrl: addonConfig.helmUrl,
        kubeVersion: addonConfig.kubeVersion,
        namespace: addonConfig.namespace,
        region: addonConfig.region,
        validated: false
      };

      this.updateConfig();

      return;
    }

    const addon = {
      accId: "",
      helmUrl: "",
      kubeVersion: "",
      namespace: "",
      region: ""
    };

    if (flags.region !== undefined && this.isValidRegion(flags.region)) {
      addon.region = flags.region;
    }

    if (flags.namespace !== undefined && this.isValidNamespace(flags.namespace)) {
      addon.namespace = flags.namespace;
    }

    if (flags.helmUrl !== undefined && this.isValidUrl(flags.helmUrl)) {
      addon.helmUrl = flags.helmUrl;
    }

    if (flags.addonName !== undefined && flags.addonVersion !== undefined) {
      if (Object.values(addon).every(value => value !== "")) {
        this.configuration[getAddonKey(flags.addonName, flags.addonVersion)] = { ...addon, validated: false };
        this.updateConfig();
      }
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

  private isValidKubernetesVersion(version: string): boolean {
    // Kubernetes versions must:
    // start with the letter v
    // has 2 periods at most
    // not more than 9 characters

    const versionRegex = /^v[0-9]+\.[0-9]+(\.[0-9]+)?$/;

    if (version.length > 9) {
      return false;
    }
    return versionRegex.test(version);
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
