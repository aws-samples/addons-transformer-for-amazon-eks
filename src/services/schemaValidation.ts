/* eslint-disable perfectionist/sort-objects */
import _Ajv from "ajv";
import * as yaml from "js-yaml";

import {IssueData} from "../types/issue.js";
import {ServiceResponse} from "../types/service.js";
import {BaseService} from "./base-service.js";
import {SleekCommand} from "../sleek-command.js";

const Ajv = _Ajv as unknown as typeof _Ajv.default;
export default class SchemaValidationService extends BaseService {
    private issueSchemaUrl:string
    constructor(commandCaller: SleekCommand, issueSchemaUrl: string) {
        super(commandCaller)
        this.issueSchemaUrl = issueSchemaUrl;
    }
    public async validateInputFileSchema(fileContents: string): Promise<ServiceResponse<IssueData>> {
        const schema = await fetch(this.issueSchemaUrl, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            mode: 'no-cors'
        })
            .then(response => response.json())
            .catch(error => {
                this.logToStderr(`Schema url: ${(this.issueSchemaUrl)}`);
                this.error('Error fetching the schema', {code: '1'});
            })
        const ajv = new Ajv({allErrors: true})
        const schemaValidator = ajv.compile(schema)

        // const data = yaml.load(fileContents, {schema:schemaJson})
        const data = yaml.load(fileContents)
        if (!schemaValidator(data)) {
            const allErrors = ['Schema validation errors: '];
            schemaValidator.errors?.map(e => allErrors.push(JSON.stringify(e)));
            this.error(allErrors.join('\n'), {exit: 1});
        }

        return {success: true, body: data as IssueData}
    }
}
