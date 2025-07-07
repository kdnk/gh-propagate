import type { PullRequest } from '../types/index.js';

export function sortPRsByMergeDateOrNumber(prs: PullRequest[]): PullRequest[] {
    return prs.sort((a, b) => {
        if ('mergedAt' in a && 'mergedAt' in b) {
            return new Date(a.mergedAt as string).getTime() - new Date(b.mergedAt as string).getTime();
        }
        return a.number - b.number;
    });
}

export function filterPRsExcludingBaseBranch(prDetails: Map<string, PullRequest>, baseBranch: string): PullRequest[] {
    return Array.from(prDetails.values()).filter((pr) => pr.headRefName !== baseBranch);
}
