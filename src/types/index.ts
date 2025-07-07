export interface PullRequest {
    number: number;
    headRefName: string;
    baseRefName: string;
    url: string;
    title: string;
}

export interface PropagateOptions {
    dryRun?: boolean;
    list?: boolean;
    numberTitles?: boolean;
    integration?: boolean;
}

export interface ChainInfo {
    branches: string[];
    prUrls: Map<string, string>;
    prDetails: Map<string, PullRequest>;
}
