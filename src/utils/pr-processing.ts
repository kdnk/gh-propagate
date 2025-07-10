import type { PullRequest } from '../types/index.js';
import { getMergedPRs } from '../services/github.js';
import { sortPRsByMergeDateOrNumber } from './pr-sorting.js';
import { getBranchesFromIntegrationToTarget } from './branch-filtering.js';

export async function getIntegrationPRsForProcessing(
    prDetails: Map<string, PullRequest>,
    branches: string[],
    integrationBranch: string,
    baseBranch: string
): Promise<PullRequest[]> {
    const excludedBranches = getBranchesFromIntegrationToTarget(branches, integrationBranch);
    const allChainPRs = Array.from(prDetails.values()).filter((pr) => !excludedBranches.includes(pr.headRefName));
    const targetBranches = allChainPRs.map((pr) => pr.headRefName);

    const mergedPRsToIntegration = await getMergedPRs(integrationBranch);
    const filteredMergedPRs = mergedPRsToIntegration.filter((pr) => targetBranches.includes(pr.headRefName));

    const allPRs = [...allChainPRs, ...filteredMergedPRs];
    const uniquePRs = allPRs.filter((pr, index, array) => array.findIndex((p) => p.number === pr.number) === index);

    return sortPRsByMergeDateOrNumber(uniquePRs);
}
