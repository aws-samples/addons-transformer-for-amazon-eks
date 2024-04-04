import fs from "node:fs";

import CreateIssueOpt from "../commandOpts/create-issue.js";
import CreateIssueService from "../services/create-issue.js";
import HelmManagerService from "../services/helm.js";
import SchemaValidationService from "../services/schemaValidation.js";
import ChartValidatorService from "../services/validate.js";
import {SleekCommand} from "../sleek-command.js";
import {IssueData} from "../types/issue.js";
import {ValidateOptions} from "../types/validate.js";
import {getChartNameFromUrl} from "../utils.js";


export class CreateIssue extends SleekCommand {
    static args = CreateIssueOpt.args;
    static description = CreateIssueOpt.description;
    static examples = CreateIssueOpt.examples;
    static flags = CreateIssueOpt.flags;
    static summary = CreateIssueOpt.summary;

    async run(): Promise<any> {
        const {args, flags} = await this.parse(CreateIssue);
        const isDryRun = flags.dryRun;
        const filePath = args.file;

        this.log(`File to process: ${filePath} ${isDryRun ? '(dry run)' : ''}`)
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const schemaValidator = new SchemaValidationService(this, flags.issueSchemaUrl);
        const data = await schemaValidator.validateInputFileSchema(fileContents);
        this.log('Schema validation correct') // it exits if not valid

        if (isDryRun) return;

        const inputDataParsed = data.body as IssueData;
        const addonData = inputDataParsed.addon;
        const repo= addonData.helmChartUrl.slice(0,Math.max(0, addonData.helmChartUrl.lastIndexOf(':')))
        const chartTag = addonData.helmChartUrl.lastIndexOf(':') ? `${addonData.helmChartUrl.slice(Math.max(0, addonData.helmChartUrl.lastIndexOf(':')+1))}` : ''
        const chartName = getChartNameFromUrl(repo);
        const helmManager = new HelmManagerService(this);
        const charPath= `${await helmManager.pullAndUnzipChart(repo!, addonData.helmChartUrlProtocol!, chartTag!, addonData.name)}/${chartName}`;
        const validatorService = new ChartValidatorService(this, charPath, addonData);
        const validateOps: ValidateOptions ={
            skipHooksValidation: inputDataParsed.chartAutoCorrection?.hooks
        }
        const validatorServiceResp = await validatorService.validate(validateOps);
        // todo: if validatorService exits when errors, not need to handle here !success
        if(!validatorServiceResp.success){
            this.error(validatorServiceResp.error?.input!, validatorServiceResp.error?.options )
        }

        this.log(`Chart validation successful`)

        // create issue base in the file input
        const title = `Onboarding ${inputDataParsed.sellerMarketPlaceAlias} ${addonData.name}@${addonData.version}`;
        const body = `Issue body:\n\n\`\`\`yaml\n${fileContents}\`\`\`\n`;
        const createIssueService = new CreateIssueService(this, flags.repoOwner, flags.repo);

        // Add label 'DEV_MODE' for forcing pull aws-sleek-transformer from the repo instead of the npm Registry
        const createIssueResponse = await createIssueService.createIssue(title, body, ['pending'])

        this.log(`Issue created: ${createIssueResponse.body?.data.html_url}`)
    }
}
