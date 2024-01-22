import {SleekCommand} from "../sleek-command.js";
import {Args, Flags} from "@oclif/core";
import * as yaml from 'js-yaml'
import * as fs from "fs";
import {Octokit} from "@octokit/core";
import _Ajv from "ajv";
import {getRepoName, getRepoOwner} from "../utils.js";

const Ajv = _Ajv as unknown as typeof _Ajv.default;

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
            aliases: ['dry-run', 'dryrun'],
            char: 'd',
            description: "Runs all checks without creating the issue",
            default: false,
        }),
        repo: Flags.string({description:"Github repository name where the issue will be created", hidden:true}),
        repoOwner: Flags.string({description:"Github repository owner", hidden:true}),
    }

    static summary = "Creates a Github Issue based in the input file";

    async run(): Promise<any> {
        const {args, flags} = await this.parse(CreateIssue);
        const isDryRun = flags.dryRun;
        const filePath = args.file;

        this.log(`File to process: ${filePath} ${isDryRun ? '(dry run)' : ''}`)

        // get schema
        const schemaJsonUrl = this.getSchemaUrl();

        const schema = await fetch(schemaJsonUrl,{
            headers : {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            mode: 'no-cors'
        })
            .then(response=> response.json())
            .catch(err=>{
                this.logToStderr(`Schema url: ${schemaJsonUrl}`)
                this.debug(err)
                this.error('Error fetching the schema', {code: '1'});
            })
        const ajv = new Ajv({allErrors: true})
        const schemaValidator = ajv.compile(schema)

        //read file
        const fileContents = fs.readFileSync(filePath, 'utf8');

        // const data = yaml.load(fileContents, {schema:schemaJson})
        const data = yaml.load(fileContents)
        if (!schemaValidator(data)) {
            this.logToStderr(`Schema validation errors: `);
            schemaValidator.errors?.map(e => this.logToStderr(JSON.stringify(e)));
            this.error('Err', {code: '1'});
        }
        this.log('Schema validation correct')
        if (isDryRun) this.exit(0);

        // create issue base in the file input
        const octokitOptions = {
            auth: process.env.GITHUB_TOKEN,
        };

        const repo = flags.repo || getRepoName();
        const owner = flags.repoOwner || getRepoOwner();

        const title = `Onboarding ${(data as issueData).sellerMarketPlaceAlias} ${(data as issueData).addon.name}@${(data as issueData).addon.version}`
        const createIssueRequest = {
            owner,
            repo,
            title,
            body: `Issue body:\n\n\`\`\`yaml\n${fileContents}\`\`\`\n`,
            labels: [
                'pending'
            ],
            headers: {
                'X-GitHub-Api-Version': '2022-11-28'
            }
        };

        // this.log(`octokitOptions ${JSON.stringify(octokitOptions)}`)
        // this.log(`create request ${JSON.stringify(createIssueRequest)}`)
        const octokit = new Octokit(octokitOptions)
        const octokitResponse = await octokit.request('POST /repos/{owner}/{repo}/issues', createIssueRequest);
        if (octokitResponse.status !== 201) {
            this.logToStderr(`Error creating issue on ${owner}/${repo} (${octokitResponse.status})`)
            this.exit(1)
        }
        this.log(`Issue created: ${octokitResponse.data.html_url}`)
    }

    private getSchemaUrl() {
        //todo: set up user public repo where the schema lives
        return 'https://raw.githubusercontent.com/elamaran11/aws-sleek-transformer/f96009d3feb4967b4d92fd57f4d1bd2cf148e1a9/src/schemas/issue-creation.schema.json'
    }
}

type issueData = {
    sellerMarketPlaceAlias: string,
    addon: addonData;
};
type addonData = {
    name: string,
    version: string
};
