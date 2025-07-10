import chalk from 'chalk';
import type { PullRequest } from '../types/index.js';
import { updatePRTitle } from '../services/github.js';
import { PR_NUMBER_PREFIX_PATTERN, MESSAGES } from '../constants/index.js';
import { getIntegrationPRsForProcessing } from './pr-processing.js';

export function removeExistingNumberPrefix(title: string): string {
    return title.replace(PR_NUMBER_PREFIX_PATTERN, '');
}

export function addNumberPrefix(title: string, position: number, total: number): string {
    const cleanTitle = removeExistingNumberPrefix(title).trim();
    const prefix = `[${position}/${total}]`;

    if (cleanTitle.startsWith('[')) {
        return `${prefix}${cleanTitle}`;
    }

    return `${prefix} ${cleanTitle}`;
}

interface UpdateTitlesOptions {
    prDetails: Map<string, PullRequest>;
    branches: string[];
    integrationBranch: string;
    baseBranch: string;
    dryRun?: boolean;
}

export async function updatePRTitlesWithNumbers(options: UpdateTitlesOptions): Promise<void> {
    const { prDetails, branches, integrationBranch, baseBranch, dryRun = false } = options;
    const prBranches = branches.filter((branch) => branch !== baseBranch);

    if (prBranches.length === 0) {
        console.log(chalk.yellow(MESSAGES.NO_PRS_TO_UPDATE));
        return;
    }

    console.log(chalk.blue(`\n${MESSAGES.UPDATING_PR_TITLES}`));

    const sortedPRs = await getIntegrationPRsForProcessing(prDetails, branches, integrationBranch);
    const targetBranches = sortedPRs.map((pr) => pr.headRefName);
    const total = sortedPRs.length;
    let successCount = 0;

    for (let i = 0; i < sortedPRs.length; i++) {
        const pr = sortedPRs[i];
        if (!pr) continue;

        if (targetBranches.includes(pr.headRefName)) {
            const position = i + 1;
            const newTitle = addNumberPrefix(pr.title, position, total);

            const success = await updatePRTitle(pr.number, newTitle, dryRun);
            if (success) {
                successCount++;
            }
        }
    }

    if (!dryRun) {
        console.log(chalk.green(`✅ Updated ${successCount}/${total} PR titles successfully`));
    }
}
