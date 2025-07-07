import chalk from 'chalk';
import { buildPRChain } from '../services/pr-chain.js';
import { sortPRsByMergeDateOrNumber, filterPRsExcludingBaseBranch } from '../utils/pr-sorting.js';
import { STATUS_ICONS, MESSAGES } from '../constants/index.js';

export async function listPRChain(
    baseBranch: string,
    targetBranch: string,
    options: { integration?: boolean } = {}
): Promise<void> {
    const { branches, prDetails } = await buildPRChain(targetBranch, baseBranch, options);

    const prBranches = branches.filter((branch) => branch !== baseBranch);

    if (prBranches.length === 0) {
        console.log(chalk.yellow(MESSAGES.NO_PRS_FOUND));
        return;
    }

    const reversedPRBranches = [...prBranches].reverse();

    if (options.integration) {
        // In integration mode, show all PRs with proper numbering
        const allPRs = filterPRsExcludingBaseBranch(prDetails, baseBranch);
        const sortedPRs = sortPRsByMergeDateOrNumber(allPRs);

        const total = sortedPRs.length;
        sortedPRs.forEach((pr, index) => {
            const position = index + 1;
            const status = prBranches.includes(pr.headRefName) ? 'open' : 'merged';
            const statusIcon = status === 'merged' ? STATUS_ICONS.MERGED : STATUS_ICONS.OPEN;
            console.log(`- [${position}/${total}] ${statusIcon} #${pr.number}: [${pr.title}](${pr.url})`);
        });
    } else {
        // Original logic for non-integration mode
        reversedPRBranches.forEach((branch, index) => {
            const pr = prDetails.get(branch);
            if (pr) {
                const position = index + 1;
                const total = reversedPRBranches.length;
                console.log(`- [${position}/${total}] #${pr.number}: [${pr.title}](${pr.url})`);
            }
        });
    }
}
