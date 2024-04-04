import {Args, Flags} from "@oclif/core";
import ValidateOpt from "./validate.js";

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
        issueSchemaUrl: ValidateOpt.flags.issueSchemaUrl,
        repo: Flags.string({
            default: "aws-eks-addon-publication",
            description:"Github repository name where the issue will be created",
            hidden:true
        }),
        repoOwner: Flags.string({
            default: "cloudsoft-fusion",
            description:"Github repository owner",
            hidden:true
        }),
    }

    static summary = "Creates a Github Issue based in the input file";

}

