import type { ChainInfo, PullRequest } from '../types/index.js';
import { getPullRequest } from './github.js';

export async function buildPRChain(startBranch: string, baseBranch: string): Promise<ChainInfo> {
    const branches: string[] = [];
    const prUrls = new Map<string, string>();
    const prDetails = new Map<string, PullRequest>();
    let currentBranch = startBranch;

    while (currentBranch !== baseBranch) {
        const pr = await getPullRequest(currentBranch);
        if (!pr) {
            throw new Error(`No pull request found for branch: ${currentBranch}`);
        }

        branches.push(currentBranch);
        prUrls.set(currentBranch, pr.url);
        prDetails.set(currentBranch, pr);
        currentBranch = pr.baseRefName;
    }

    branches.push(baseBranch);
    return { branches, prUrls, prDetails };
}
