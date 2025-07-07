import chalk from 'chalk';
import { buildPRChain } from '../services/pr-chain.js';

export async function listPRChain(
    baseBranch: string,
    targetBranch: string,
    options: { integration?: boolean } = {}
): Promise<void> {
    const { branches, prDetails } = await buildPRChain(targetBranch, baseBranch, options);

    const prBranches = branches.filter((branch) => branch !== baseBranch);

    if (prBranches.length === 0) {
        console.log(chalk.yellow('No PRs found in chain'));
        return;
    }

    const reversedPRBranches = [...prBranches].reverse();

    if (options.integration) {
        // In integration mode, show all PRs with proper numbering
        const allPRs = Array.from(prDetails.values()).filter((pr) => pr.headRefName !== baseBranch);
        const sortedPRs = allPRs.sort((a, b) => {
            // Sort by merge date if available, otherwise by number
            if ('mergedAt' in a && 'mergedAt' in b) {
                return new Date(a.mergedAt as string).getTime() - new Date(b.mergedAt as string).getTime();
            }
            return a.number - b.number;
        });

        const total = sortedPRs.length;
        sortedPRs.forEach((pr, index) => {
            const position = index + 1;
            const status = prBranches.includes(pr.headRefName) ? 'open' : 'merged';
            const statusIcon = status === 'merged' ? '✓' : '○';
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
