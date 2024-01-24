import fs from "node:fs";

import CreateIssueOpt from "./opts/create-issue-opt.js";
import {SleekCommand} from "../sleek-command.js";
import CreateIssueService from "../services/create-issue.js";
import {IssueData} from "../types/issue.js";
import SchemaValidationService from "../services/schemaValidation.js";


export class CreateIssue extends SleekCommand {
    static description = CreateIssueOpt.description;
    static summary = CreateIssueOpt.summary;
    static examples = CreateIssueOpt.examples;
    static args = CreateIssueOpt.args;
    static flags = CreateIssueOpt.flags;

    async run(): Promise<any> {

        const {args, flags} = await this.parse(CreateIssue);
        const isDryRun = flags.dryRun;
        const filePath = args.file;

        this.log(`File to process: ${filePath} ${isDryRun ? '(dry run)' : ''}`)
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const schemaValidator = new SchemaValidationService(this);
        const data = await schemaValidator.validateInputFileSchema(fileContents);
        this.log('Schema validation correct') // it exits if not valid

        if (isDryRun) return;
        // todo
        // validateChart(helmCharName, helmChartVersion);

        // create issue base in the file input
        const title = `Onboarding ${(data.body as IssueData).sellerMarketPlaceAlias} ${(data.body as IssueData).addon.name}@${(data.body as IssueData).addon.version}`;
        const body = `Issue body:\n\n\`\`\`yaml\n${fileContents}\`\`\`\n`;
        const createIssueService = new CreateIssueService(this);
        const createIssueResponse = await createIssueService.createIssue(title, body, ['pending'])

        this.log(`Issue created: ${createIssueResponse.body?.data.html_url}`)
    }
}
