/* eslint-disable perfectionist/sort-objects */
import type {OctokitResponse} from "@octokit/types/dist-types/OctokitResponse.js";

import {Octokit} from "@octokit/core";

import {SleekCommand} from "../sleek-command.js";
import {ServiceResponse} from "../types/service.js";
import {BaseService} from "./base-service.js";

export default class CreateIssueService extends BaseService {

    private repo:string;
    private repoOwner:string;

    constructor(commandCaller: SleekCommand, repoOwner: string, repo: string) {
        super(commandCaller)
        this.repoOwner = repoOwner;
        this.repo = repo;
    }
    public createIssue = async (title: string, body: string, labels: string[]): Promise<ServiceResponse<OctokitResponse<any>>> => this.createIssueOnRepo(this.repo, this.repoOwner, title, body, labels)

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
            .then((response)=> ({success: true, body: response}))
            .catch((error)=>{this.error(`Create issue error: ${error}`)})
    }
}
