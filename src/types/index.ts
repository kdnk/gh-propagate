export interface PullRequest {
    number: number;
    headRefName: string;
    baseRefName: string;
    url: string;
    title: string;
    body?: string;
    state?: 'OPEN' | 'MERGED' | 'CLOSED';
    mergedAt?: string;
}

export interface OpenPullRequest extends PullRequest {
    state: 'OPEN';
}

export interface MergedPullRequest extends PullRequest {
    state: 'MERGED';
    mergedAt: string;
}

export type PullRequestWithState = OpenPullRequest | MergedPullRequest;

export interface PropagateOptions {
    dryRun?: boolean;
    list?: boolean;
    edit?: EditOperation[];
    integration?: string;
    debug?: boolean;
}

export type EditOperation = 'title' | 'desc';

export interface ChainInfo {
    branches: string[];
    prUrls: Map<string, string>;
    prDetails: Map<string, PullRequest>;
}
