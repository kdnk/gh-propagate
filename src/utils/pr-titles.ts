import chalk from 'chalk';
import type { PullRequest } from '../types/index.js';
import { updatePRTitle } from '../services/github.js';
import { sortPRsByMergeDateOrNumber, filterPRsExcludingBaseBranch } from './pr-sorting.js';
import { PR_NUMBER_PREFIX_PATTERN, MESSAGES } from '../constants/index.js';

export function removeExistingNumberPrefix(title: string): string {
    return title.replace(PR_NUMBER_PREFIX_PATTERN, '');
}

export function addNumberPrefix(title: string, position: number, total: number): string {
    const cleanTitle = removeExistingNumberPrefix(title).trim();
    const prefix = `[${position}/${total}]`;

    if (cleanTitle.startsWith('[')) {
        return `${prefix} ${cleanTitle}`;
    }

    return `${prefix} ${cleanTitle}`;
}

interface UpdateTitlesOptions {
    prDetails: Map<string, PullRequest>;
    branches: string[];
    baseBranch: string;
    dryRun?: boolean;
    integration?: boolean;
}

export async function updatePRTitlesWithNumbers(options: UpdateTitlesOptions): Promise<void> {
    const { prDetails, branches, baseBranch, dryRun = false, integration = false } = options;
    const prBranches = branches.filter((branch) => branch !== baseBranch);

    if (prBranches.length === 0) {
        console.log(chalk.yellow(MESSAGES.NO_PRS_TO_UPDATE));
        return;
    }

    console.log(chalk.blue(`\n${MESSAGES.UPDATING_PR_TITLES}`));

    if (integration) {
        await updatePRTitlesInIntegrationMode(prDetails, prBranches, baseBranch, dryRun);
    } else {
        await updatePRTitlesInNormalMode(prDetails, prBranches, dryRun);
    }
}

async function updatePRTitlesInIntegrationMode(
    prDetails: Map<string, PullRequest>,
    prBranches: string[],
    baseBranch: string,
    dryRun: boolean
): Promise<void> {
    const allPRs = filterPRsExcludingBaseBranch(prDetails, baseBranch);
    const sortedPRs = sortPRsByMergeDateOrNumber(allPRs);
    const total = allPRs.length;
    let successCount = 0;

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

    console.log(chalk.green(`\n✅ Updated ${successCount}/${total} PR titles successfully`));
}

async function updatePRTitlesInNormalMode(
    prDetails: Map<string, PullRequest>,
    prBranches: string[],
    dryRun: boolean
): Promise<void> {
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
