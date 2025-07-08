import chalk from 'chalk';
import { buildPRChain } from '../services/pr-chain.js';
import { sortPRsByMergeDateOrNumber, filterPRsExcludingBaseBranch } from '../utils/pr-sorting.js';
import { findIntegrationPR } from '../utils/edit-operations.js';
import { STATUS_ICONS, MESSAGES } from '../constants/index.js';

export async function listPRChain(baseBranch: string, targetBranch: string): Promise<void> {
    // Always use integration mode for accurate PR listing
    const { branches, prDetails } = await buildPRChain(targetBranch, baseBranch, { integration: true });

    const prBranches = branches.filter((branch) => branch !== baseBranch);

    if (prBranches.length === 0) {
        console.log(chalk.yellow(MESSAGES.NO_PRS_FOUND));
        return;
    }

    // Find the integration PR first
    const integrationPR = findIntegrationPR(prDetails, branches, baseBranch);
    if (!integrationPR) {
        console.log(chalk.yellow('⚠️  No integration branch detected'));
        return;
    }
    
    // Only show PRs that merge directly into the integration branch
    const integrationBranchPRs = Array.from(prDetails.values()).filter(
        (pr) => pr.baseRefName === integrationPR.headRefName
    );
    
    const sortedPRs = sortPRsByMergeDateOrNumber(integrationBranchPRs);

    const total = sortedPRs.length;
    sortedPRs.forEach((pr, index) => {
        const position = index + 1;
        const status = prBranches.includes(pr.headRefName) ? 'open' : 'merged';
        const statusIcon = status === 'merged' ? STATUS_ICONS.MERGED : STATUS_ICONS.OPEN;
        console.log(`- [${position}/${total}] ${statusIcon} #${pr.number}: [${pr.title}](${pr.url})`);
    });
}
