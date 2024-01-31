import {Octokit} from "@octokit/core";
import {ServiceResponse} from "../types/service.js";
import type {OctokitResponse} from "@octokit/types/dist-types/OctokitResponse.js";
import {BaseService} from "./base-service.js";

export default class CreateIssueService extends BaseService {
    public createIssue = async (title: string, body: string, labels: string[]): Promise<ServiceResponse<OctokitResponse<any>>> => {
        return this.createIssueOnRepo(getRepoName(), getRepoOwner(), title, body, labels);
    }

    private createIssueOnRepo = async (repo: string, owner: string, title: string, body: string, labels: string[]): Promise<ServiceResponse<OctokitResponse<any>>> => {
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
        const octokitResponsePromise = octokit.request('POST /repos/{owner}/{repo}/issues', createIssueRequest);
        return octokitResponsePromise
            .then((response)=> {return {success: true, body: response}})
            .catch((error)=>{this.error(`YY ${error}`)})
    }
}

function getRepoOwner() {
    return 'cloudsoft-fusion';
}

function getRepoName() {
    return 'aws-k8s-addons'
}
