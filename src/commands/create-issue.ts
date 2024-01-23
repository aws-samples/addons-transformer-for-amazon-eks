import {Octokit} from "@octokit/core";
import _Ajv from "ajv";
import * as yaml from "js-yaml";
import fs from "node:fs";

import CreateIssueOpt from "../opts/create-issue-opt.js";
import {SleekCommand} from "../sleek-command.js";
import {getRepoName, getRepoOwner} from "../utils.js";

const Ajv = _Ajv as unknown as typeof _Ajv.default;

export default class CreateIssueService extends SleekCommand {
    command = new CreateIssueOpt()

    async run(): Promise<any> {
        const {args, flags} = await this.parse(CreateIssueOpt);
        const isDryRun = flags.dryRun;
        const filePath = args.file;

        this.log(`File to process: ${filePath} ${isDryRun ? '(dry run)' : ''}`)

        // get schema
        const schemaJsonUrl = this.command.getSchemaUrl();

        const schema = await fetch(schemaJsonUrl,{
            headers : {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            mode: 'no-cors'
        })
            .then(response=> response.json())
            .catch(error => {
                this.logToStderr(`Schema url: ${schemaJsonUrl}`)
                this.debug(error)
                this.error('Error fetching the schema', {code: '1'});
            })
        const ajv = new Ajv({allErrors: true})
        const schemaValidator = ajv.compile(schema)

        //  read file
        const fileContents = fs.readFileSync(filePath, 'utf8');

        // const data = yaml.load(fileContents, {schema:schemaJson})
        const data = yaml.load(fileContents)
        if (!schemaValidator(data)) {
            const allErrors = ['Schema validation errors: '];
            schemaValidator.errors?.map(e => allErrors.push(JSON.stringify(e)));
            this.error(allErrors.join('\n'), {exit: 1});
        }

        this.log('Schema validation correct')

        if (isDryRun) return ;

        // create issue base in the file input
        const octokitOptions = {
            auth: process.env.GITHUB_TOKEN,
        };

        const repo = flags.repo || getRepoName();
        const owner = flags.repoOwner || getRepoOwner();

        const title = `Onboarding ${(data as issueData).sellerMarketPlaceAlias} ${(data as issueData).addon.name}@${(data as issueData).addon.version}`
        const createIssueRequest = {
            body: `Issue body:\n\n\`\`\`yaml\n${fileContents}\`\`\`\n`,
            headers: {
                'X-GitHub-Api-Version': '2022-11-28'
            },
            labels: [
                'pending'
            ],
            owner,
            repo,
            title
        };

        // this.log(`octokitOptions ${JSON.stringify(octokitOptions)}`)
        // this.log(`create request ${JSON.stringify(createIssueRequest)}`)
        const octokit = new Octokit(octokitOptions)
        const octokitResponse = await octokit.request('POST /repos/{owner}/{repo}/issues', createIssueRequest);
        if (octokitResponse.status !== 201) {
            this.error(`Error creating issue on ${owner}/${repo} (${octokitResponse.status})`, {exit:1} )
        }

        this.log(`Issue created: ${octokitResponse.data.html_url}`)
    }
}

type addonData = {
    name: string,
    version: string
};
type issueData = {
    addon: addonData;
    sellerMarketPlaceAlias: string,
};
