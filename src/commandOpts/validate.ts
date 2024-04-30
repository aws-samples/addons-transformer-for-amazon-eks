import {Args, Flags} from "@oclif/core";

export default class ValidateOpt {
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
    '<%= config.bin %> <%= command.id %> oci://12345678901.dkr.ecr.us-east-2.amazonaws.com/example-charts:x.x.x',
    '<%= config.bin %> <%= command.id %> -r 12345678901.dkr.ecr.us-east-2.amazonaws.com/example-charts -p oci -v x.x.x',
    '<%= config.bin %> <%= command.id %> -f ./input.yaml',
    '<%= config.bin %> <%= command.id %> -d ./addon-folder',
    '<%= config.bin %> <%= command.id %> --help',
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
    // todo check Flags.url type
    file: Flags.string({
      description: "Path to add-on input file",
      exclusive: ['helmUrl'], char: 'f'
    }), // or file or URL, full or bits
    directory: Flags.string({
      description: "Path to the local addon folder",
      char: 'd',
      exclusive: ['file', 'helmUrl']
    }),
    helmUrl: Flags.string({
      description: "Fully qualified URL of the Repo including version tag",
      exclusive: ['file']
    }),  // fully qualified URL of helm repo
    helmRepo: Flags.string({
      description: "URL of the helm repo containg protocol and repo",
      exclusive: ['file', 'helmUrl'],
      char: 'r'
    }),  // construct it piecemeal
    protocol: Flags.string({
      description: "Protocol of the helm hosting to use",
      exclusive: ['file', 'helmUrl'],
      char: 'p'
    }),
    version: Flags.string({
      description: "Version of the addon to validate",
      exclusive: ['file'],
      char: 'v'
    }),
    addonName: Flags.string({
      description: "Name of the addon"
    }),
    addonNamespace: Flags.string({
      description: "Add-on namespace",
      char: 'n'
    }),
    k8sVersions: Flags.string({
      description: "Comma separated list of supported kubernetes versions"
    }),
    skipHooks: Flags.boolean({
      description: "Skip helm hooks validation",
      default: false
    }),
    skipReleaseService: Flags.boolean({
      description: "Skip .Release.Service occurrences",
      default: false
    }),
    issueSchemaUrl: Flags.string({
      default: "https://raw.githubusercontent.com/aws-samples/addons-transformer-for-amazon-eks/main/schema/onboarding.schema.json",
      description: "URL for the schema used for issue input file",
      hidden: true
    }),
  }

  static summary = "Validates the addon after pulling it from the helm repository.";
}
