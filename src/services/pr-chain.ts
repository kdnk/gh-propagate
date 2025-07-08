import type { ChainInfo, PullRequest } from '../types/index.js';
import { getPullRequest, getMergedPRs } from './github.js';

export async function buildPRChain(
    startBranch: string,
    baseBranch: string,
    options: { integration?: boolean; integrationBranch?: string } = {}
): Promise<ChainInfo> {
    const branches: string[] = [];
    const prUrls = new Map<string, string>();
    const prDetails = new Map<string, PullRequest>();
    let currentBranch = startBranch;

    // Build chain from startBranch to baseBranch
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

    // If integration mode and integration branch is specified, include merged PRs
    if (options.integration && options.integrationBranch) {
        const mergedPRs = await getMergedPRs(options.integrationBranch);

        for (const mergedPR of mergedPRs) {
            // Only add if not already in the chain
            if (!prDetails.has(mergedPR.headRefName)) {
                prDetails.set(mergedPR.headRefName, mergedPR);
                prUrls.set(mergedPR.headRefName, mergedPR.url);
            }
        }
    }

    return { branches, prUrls, prDetails };
}
