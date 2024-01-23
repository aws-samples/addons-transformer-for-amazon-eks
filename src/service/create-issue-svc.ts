import * as yaml from "js-yaml";
import _Ajv from "ajv";
import {SleekCommand} from "../sleek-command.js";
import {issueData} from "../commands/create-issue.js";
import {Octokit} from "@octokit/core";

const Ajv = _Ajv as unknown as typeof _Ajv.default;

export async function createIssue(repo: string, owner: string, title: string, body: string, callerCommand: SleekCommand, labels: string[] = []): Promise<svcResponse> {
    const octokitOptions = {
        auth: process.env.GITHUB_TOKEN,
    };

    const createIssueRequest = {
        headers: {
            'X-GitHub-Api-Version': '2022-11-28'
        },
        body,
        owner,
        repo,
        title,
        labels
    };

    const octokit = new Octokit(octokitOptions)
    const octokitResponse = await octokit.request('POST /repos/{owner}/{repo}/issues', createIssueRequest);
    if (octokitResponse.status !== 201) {
        callerCommand.error(`Error creating issue on ${owner}/${repo} (${octokitResponse.status})`, {exit: 1})
    }
    return {success: true, body:octokitResponse}
}

export async function validateInputFileSchema(fileContents: string, callerCommand: SleekCommand): Promise<svcResponse> {
    // get schema
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
            callerCommand.logToStderr(`Schema url: ${schemaJsonUrl}`)
            console.debug(err)
            callerCommand.error('Error fetching the schema', {code: '1'});
        })
    const ajv = new Ajv({allErrors: true})
    const schemaValidator = ajv.compile(schema)

    // const data = yaml.load(fileContents, {schema:schemaJson})
    const data = yaml.load(fileContents)
    if (!schemaValidator(data)) {
        const allErrors = ['Schema validation errors: '];
        schemaValidator.errors?.map(e => allErrors.push(JSON.stringify(e)));
        callerCommand.error(allErrors.join('\n'), {exit: 1});
    }
    return {success: true, body: data as issueData}
}

function getSchemaUrl(): string {
    //  todo: set up user public repo where the schema lives
    return 'https://raw.githubusercontent.com/elamaran11/aws-sleek-transformer/f96009d3feb4967b4d92fd57f4d1bd2cf148e1a9/src/schemas/issue-creation.schema.json'
}

export type svcResponse = {
    success: boolean,
    body?: any,
    error?: {
        input: Error | string, options?: {
            code?: string;
            exit?: number;
        }
    },
}

