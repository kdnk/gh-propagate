import type { PullRequest } from '../types/index.js';
import { getMergedPRs } from '../services/github.js';

function sortPRsByMergeDateOrNumber(prs: PullRequest[]): PullRequest[] {
    return prs.sort((a, b) => {
        if ('mergedAt' in a && 'mergedAt' in b) {
            return new Date(a.mergedAt as string).getTime() - new Date(b.mergedAt as string).getTime();
        }
        return a.number - b.number;
    });
}

/**
 * Get branches from integration branch to target branch (excluding integration branch itself)
 * @param branches Array of branch names in the PR chain
 * @param integrationBranch The integration branch name
 * @returns Array of branch names from integration branch onwards (excluding integration branch itself)
 */
function getBranchesFromIntegrationToTarget(branches: string[], integrationBranch: string): string[] {
    const integrationIndex = branches.indexOf(integrationBranch);

    if (integrationIndex === -1) {
        // Integration branch not found in chain, return all branches except base
        return branches.filter((branch) => branch !== branches[0]);
    }

    // Return branches from integration branch onwards (excluding integration branch itself)
    return branches.slice(integrationIndex + 1);
}

export async function getIntegrationPRsForProcessing(
    prDetails: Map<string, PullRequest>,
    branches: string[],
    integrationBranch: string
): Promise<PullRequest[]> {
    const excludedBranches = getBranchesFromIntegrationToTarget(branches, integrationBranch);
    const allChainPRs = Array.from(prDetails.values()).filter(
        (pr) => !excludedBranches.includes(pr.headRefName) && pr.headRefName !== integrationBranch
    );
    const targetBranches = allChainPRs.map((pr) => pr.headRefName);

    const mergedPRsToIntegration = await getMergedPRs(integrationBranch);
    const filteredMergedPRs = mergedPRsToIntegration.filter((pr) => targetBranches.includes(pr.headRefName));

    const allPRs = [...allChainPRs, ...filteredMergedPRs];
    const uniquePRs = allPRs.filter((pr, index, array) => array.findIndex((p) => p.number === pr.number) === index);

    return sortPRsByMergeDateOrNumber(uniquePRs);
}
