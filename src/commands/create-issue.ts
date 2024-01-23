import {Octokit} from "@octokit/core";
import _Ajv from "ajv";
import * as yaml from "js-yaml";
import fs from "node:fs";

import CreateIssueOpt from "./opts/create-issue-opt.js";
import {SleekCommand} from "../sleek-command.js";
import {getRepoName, getRepoOwner} from "../utils.js";
import {createIssue, validateInputFileSchema} from "../service/create-issue-svc.js";

const Ajv = _Ajv as unknown as typeof _Ajv.default;

export default class CreateIssue extends SleekCommand {
    static description = CreateIssueOpt.description;
    static summary = CreateIssueOpt.summary;
    static examples= CreateIssueOpt.examples;
    static args= CreateIssueOpt.args;
    static flags= CreateIssueOpt.flags;

    async run(): Promise<any> {

        const {args, flags} = await this.parse(CreateIssue);
        const isDryRun = flags.dryRun;
        const filePath = args.file;

        this.log(`File to process: ${filePath} ${isDryRun ? '(dry run)' : ''}`)
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const data = await validateInputFileSchema(fileContents, this);
        this.log('Schema validation correct') // it exits if not valid

        if (isDryRun) return ;
        // todo
        // validateChart(helmCharName, helmChartVersion);

        // create issue base in the file input
        const repo = flags.repo || getRepoName();
        const owner = flags.repoOwner || getRepoOwner();
        const title = `Onboarding ${(data.body as issueData).sellerMarketPlaceAlias} ${(data.body as issueData).addon.name}@${(data.body as issueData).addon.version}`;
        const body= `Issue body:\n\n\`\`\`yaml\n${fileContents}\`\`\`\n`;
        const createIssueResponse = await createIssue(repo, owner, title, body,this, ['pending'])

        this.log(`Issue created: ${createIssueResponse.body.data.html_url}`)
    }
}

export type addonData = {
    name: string,
    version: string
};

export type issueData = {
    addon: addonData;
    sellerMarketPlaceAlias: string,
};
