import chalk from 'chalk';
import type { PullRequest } from '../types/index.js';
import { updatePRTitle } from '../services/github.js';

export function removeExistingNumberPrefix(title: string): string {
    return title.replace(/^\[\d+\/\d+\]/, '');
}

export function addNumberPrefix(title: string, position: number, total: number): string {
    const cleanTitle = removeExistingNumberPrefix(title);
    const prefix = `[${position}/${total}]`;

    if (cleanTitle.startsWith('[')) {
        return `${prefix}${cleanTitle}`;
    }

    return `${prefix} ${cleanTitle}`;
}

export async function updatePRTitlesWithNumbers(
    prDetails: Map<string, PullRequest>,
    branches: string[],
    baseBranch: string,
    dryRun: boolean = false,
    integration: boolean = false
): Promise<void> {
    const prBranches = branches.filter((branch) => branch !== baseBranch);

    if (prBranches.length === 0) {
        console.log(chalk.yellow('No PRs found to update'));
        return;
    }

    console.log(chalk.blue(`\n🔢 Updating PR titles with sequential numbering...`));

    const reversedPRBranches = [...prBranches].reverse();
    
    // In integration mode, calculate total including merged PRs
    const total = integration ? prDetails.size - 1 : reversedPRBranches.length; // -1 to exclude baseBranch
    let successCount = 0;

    // In integration mode, we need to consider merged PRs for proper numbering
    if (integration) {
        // Get all PRs and sort by merge date or creation order
        const allPRs = Array.from(prDetails.values()).filter(pr => pr.headRefName !== baseBranch);
        const sortedPRs = allPRs.sort((a, b) => {
            // Sort by merge date if available, otherwise by number
            if ('mergedAt' in a && 'mergedAt' in b) {
                return new Date(a.mergedAt as string).getTime() - new Date(b.mergedAt as string).getTime();
            }
            return a.number - b.number;
        });

        for (let i = 0; i < sortedPRs.length; i++) {
            const pr = sortedPRs[i];
            if (!pr) continue;
            
            // Only update open PRs (those in the current branch chain)
            if (prBranches.includes(pr.headRefName)) {
                const position = i + 1;
                const newTitle = addNumberPrefix(pr.title, position, total);

                const success = await updatePRTitle(pr.number, newTitle, dryRun);
                if (success) {
                    console.log(chalk.green(`✓ PR #${pr.number}: "${newTitle}"`));
                    successCount++;
                }
            }
        }
    } else {
        // Original logic for non-integration mode
        for (let i = 0; i < reversedPRBranches.length; i++) {
            const branch = reversedPRBranches[i];
            if (!branch) continue;
            const pr = prDetails.get(branch);

            if (pr) {
                const position = i + 1;
                const newTitle = addNumberPrefix(pr.title, position, total);

                const success = await updatePRTitle(pr.number, newTitle, dryRun);
                if (success) {
                    console.log(chalk.green(`✓ PR #${pr.number}: "${newTitle}"`));
                    successCount++;
                }
            }
        }
    }

    console.log(chalk.green(`\n✅ Updated ${successCount}/${total} PR titles successfully`));
}
