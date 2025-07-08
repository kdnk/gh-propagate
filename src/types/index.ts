export interface PullRequest {
    number: number;
    headRefName: string;
    baseRefName: string;
    url: string;
    title: string;
    body?: string;
    state?: 'open' | 'merged' | 'closed';
    mergedAt?: string;
}

export interface OpenPullRequest extends PullRequest {
    state: 'open';
}

export interface MergedPullRequest extends PullRequest {
    state: 'merged';
    mergedAt: string;
}

export type PullRequestWithState = OpenPullRequest | MergedPullRequest;

export interface PropagateOptions {
    dryRun?: boolean;
    list?: boolean;
    edit?: EditOperation[];
    debug?: boolean;
}

export type EditOperation = 'title' | 'desc';

export interface ChainInfo {
    branches: string[];
    prUrls: Map<string, string>;
    prDetails: Map<string, PullRequest>;
}
