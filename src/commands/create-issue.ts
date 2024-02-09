import fs from "node:fs";

import CreateIssueOpt from "../commandOpts/create-issue.js";
import {SleekCommand} from "../sleek-command.js";
import CreateIssueService from "../services/create-issue.js";
import {ChartAutoCorrection, IssueData} from "../types/issue.js";
import SchemaValidationService from "../services/schemaValidation.js";
import ChartValidatorService from "../services/validate.js";
import {execSync} from "child_process";
import {ValidateOptions} from "../types/validate.js";
import {getChartNameFromUrl} from "../utils.js";
import HelmManagerService from "../services/helm.js";


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

        const inputDataParsed = data.body as IssueData;
        const addonData = inputDataParsed.addon;
        const repo= addonData.helmChartUrl.substring(0,addonData.helmChartUrl.lastIndexOf(':'))
        const chartTag = addonData.helmChartUrl.lastIndexOf(':') ? `${addonData.helmChartUrl.substring(addonData.helmChartUrl.lastIndexOf(':')+1)}` : ''
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
        const createIssueService = new CreateIssueService(this);

        // Add label 'DEV_MODE' for forcing pull aws-sleek-transformer from the repo instead of the npm Registry
        const createIssueResponse = await createIssueService.createIssue(title, body, ['pending'])

        this.log(`Issue created: ${createIssueResponse.body?.data.html_url}`)
    }
}
