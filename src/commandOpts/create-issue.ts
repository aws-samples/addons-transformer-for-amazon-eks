import {Args, Flags} from "@oclif/core";

export default class CreateIssueOpt {

    static args = {
        file: Args.string(
            {
                description: 'Path to add-on input file',
                required: true,
            }
        ),
    }

    static description = `
        This creates a Github Issue on the Sleek repository.
        
        It will validate the input file to match the schema
        
        TODO:
          * Run validation before creating the issue
    `

    static examples = [
        '<%= config.bin %> <%= command.id %> filename',
    ]

    static flags = {
        dryRun: Flags.boolean({
            aliases: ['dry-run', 'dryrun'],
            char: 'd',
            default: false,
            description: "Runs all checks without creating the issue",
        }),
        file: Flags.string({description: "Path to add-on input file"}),
        repo: Flags.string({description:"Github repository name where the issue will be created", hidden:true}),
        repoOwner: Flags.string({description:"Github repository owner", hidden:true}),
    }

    static summary = "Creates a Github Issue based in the input file";

}

