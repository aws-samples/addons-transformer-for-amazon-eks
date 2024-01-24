import fs from "node:fs";

import CreateIssueOpt from "../commandOpts/create-issue.js";
import {SleekCommand} from "../sleek-command.js";
import CreateIssueService from "../services/create-issue.js";
import {IssueData} from "../types/issue.js";
import SchemaValidationService from "../services/schemaValidation.js";
import ChartValidatorService from "../services/validate.js";
import {execSync} from "child_process";


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
        const charPath=await this.pullHelmChart(addonData.name, chartTag, repo)
        const validatorService = new ChartValidatorService(this, { chart: charPath});
        const validatorServiceResp = await validatorService.run();
        // todo: if validatorService exits when errors, not need to handle here !success
        if(!validatorServiceResp.success){
            this.error(validatorServiceResp.error?.input!, validatorServiceResp.error?.options )
        }
        this.log(`Chart validation successful`)

        // create issue base in the file input
        const title = `Onboarding ${inputDataParsed.sellerMarketPlaceAlias} ${addonData.name}@${addonData.version}`;
        const body = `Issue body:\n\n\`\`\`yaml\n${fileContents}\`\`\`\n`;
        const createIssueService = new CreateIssueService(this);
        const createIssueResponse = await createIssueService.createIssue(title, body, ['pending'])

        this.log(`Issue created: ${createIssueResponse.body?.data.html_url}`)
    }

    private async pullHelmChart(name:string, chartTag:string, url:string): Promise<string> {
        const chartVersionFlag = !! chartTag ? `--version ${chartTag}`:''
        const untarLocation = `./unzipped-${name}`;
        const pullCmd = `rm -rf ${untarLocation} && 
                             mkdir ${untarLocation} && 
                             helm pull oci://${url} ${chartVersionFlag} --untar --untardir ${untarLocation} >/dev/null 2>&1`;
        try {
            execSync(pullCmd);
        } catch (e) {
            this.error(`Helm chart pull failed with error ${e}`);
        }
        return untarLocation;
    }
}
