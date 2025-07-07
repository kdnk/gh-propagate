export interface PullRequest {
    number: number;
    headRefName: string;
    baseRefName: string;
    url: string;
    title: string;
    body?: string;
}

export interface PropagateOptions {
    dryRun?: boolean;
    list?: boolean;
    edit?: string[];
    integration?: boolean;
}

export type EditOperation = 'titles' | 'integration';

export interface ChainInfo {
    branches: string[];
    prUrls: Map<string, string>;
    prDetails: Map<string, PullRequest>;
}
