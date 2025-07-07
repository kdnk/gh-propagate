import chalk from 'chalk';
import { buildPRChain } from '../services/pr-chain.js';
import { sortPRsByMergeDateOrNumber, filterPRsExcludingBaseBranch } from '../utils/pr-sorting.js';
import { STATUS_ICONS, MESSAGES } from '../constants/index.js';

export async function listPRChain(baseBranch: string, targetBranch: string): Promise<void> {
    // Always use integration mode for accurate PR listing
    const { branches, prDetails } = await buildPRChain(targetBranch, baseBranch, { integration: true });

    const prBranches = branches.filter((branch) => branch !== baseBranch);

    if (prBranches.length === 0) {
        console.log(chalk.yellow(MESSAGES.NO_PRS_FOUND));
        return;
    }

    // Always show all PRs with proper numbering (including merged PRs)
    const allPRs = filterPRsExcludingBaseBranch(prDetails, baseBranch);
    const sortedPRs = sortPRsByMergeDateOrNumber(allPRs);

    const total = sortedPRs.length;
    sortedPRs.forEach((pr, index) => {
        const position = index + 1;
        const status = prBranches.includes(pr.headRefName) ? 'open' : 'merged';
        const statusIcon = status === 'merged' ? STATUS_ICONS.MERGED : STATUS_ICONS.OPEN;
        console.log(`- [${position}/${total}] ${statusIcon} #${pr.number}: [${pr.title}](${pr.url})`);
    });
}
