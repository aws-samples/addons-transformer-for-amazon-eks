import {BaseService} from "./base-service.js";
import {ServiceResponse} from "../types/service.js";
import {SleekCommand} from "../sleek-command.js";
import {IssueData} from "../types/issue.js";
import _Ajv from "ajv";
import * as yaml from "js-yaml";

const Ajv = _Ajv as unknown as typeof _Ajv.default;
export default class SchemaValidationService extends BaseService {
    public async validateInputFileSchema(fileContents: string): Promise<ServiceResponse<IssueData>> {
        const schemaJsonUrl = getSchemaUrl();
        const schema = await fetch(schemaJsonUrl, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            mode: 'no-cors'
        })
            .then(response => response.json())
            .catch(err => {
                this.logToStderr(`Schema url: ${schemaJsonUrl}`);
                console.debug(err);
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

function getSchemaUrl(): string {
    //  todo: set up user public repo where the schema lives
    return 'https://gist.githubusercontent.com/jcabrerizo/2221586776b47eeb3943d9276cc913a5/raw/46591727f019323a4f08fed7ab5e9d132a42bffe/gistfile1.txt';
}
