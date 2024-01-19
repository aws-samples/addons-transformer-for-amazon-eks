import {SleekCommand} from "../sleek-command.js";
import {Args, Flags} from "@oclif/core";

export default class CreateIssue extends SleekCommand {

    static description = `
        This creates a Github Issue on the Sleek repository.
        
        It will validate the input file to match the schema
        
        TODO:
          * Run validation before creating the issue
    `

    static examples = [
        '<%= config.bin %> <%= command.id %> filename',
    ]

    static args = {
        file: Args.string(
            {
                required: true,
                description: 'Path to add-on input file',
            }
        ),
    }

    static flags = {
        file: Flags.string({description: "Path to add-on input file"}),
        dryRun: Flags.boolean({
            aliases:['dry-run','dryrun'],
            char: 'd',
            description: "Runs all checks without creating the issue",
            default: false,
        }),
    }

    static summary = "Creates a Github Issue based in the input file";

    async run(): Promise<any> {
        const {args, flags} = await this.parse(CreateIssue);
        this.log(`file: ${args.file}`)
        this.log(`file: ${args['file']}`)
        this.log(`dr: ${flags.dryRun}`)
        throw new Error("Method not implemented.");
    }

}
