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
    dryRun: boolean = false
): Promise<void> {
    const prBranches = branches.filter((branch) => branch !== baseBranch);

    if (prBranches.length === 0) {
        console.log(chalk.yellow('No PRs found to update'));
        return;
    }

    console.log(chalk.blue(`\n🔢 Updating PR titles with sequential numbering...`));

    const reversedPRBranches = [...prBranches].reverse();
    const total = reversedPRBranches.length;
    let successCount = 0;

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

    console.log(chalk.green(`\n✅ Updated ${successCount}/${total} PR titles successfully`));
}
