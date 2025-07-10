import chalk from 'chalk';
import type { PullRequest } from '../types/index.js';
import { updatePRTitle, getMergedPRs } from '../services/github.js';
import { sortPRsByMergeDateOrNumber, filterPRsExcludingBaseBranch } from './pr-sorting.js';
import { PR_NUMBER_PREFIX_PATTERN, MESSAGES } from '../constants/index.js';

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

function getBranchesFromIntegrationToTarget(branches: string[], integrationBranch: string): string[] {
    console.log(`🔍 Debug - All branches: [${branches.join(' ← ')}]`);
    console.log(`🔍 Debug - Integration branch: ${integrationBranch}`);

    const integrationIndex = branches.indexOf(integrationBranch);
    console.log(`🔍 Debug - Integration index: ${integrationIndex}`);

    if (integrationIndex === -1) {
        // Integration branch not found in chain, return all branches except base
        const result = branches.filter((branch) => branch !== branches[0]);
        console.log(`🔍 Debug - Integration not found, returning: [${result.join(', ')}]`);
        return result;
    }

    // Return branches from integration branch onwards (excluding integration branch itself)
    const result = branches.slice(integrationIndex + 1);
    console.log(`🔍 Debug - Returning branches from integration onwards: [${result.join(', ')}]`);
    return result;
}

export async function updatePRTitlesWithNumbers(options: UpdateTitlesOptions): Promise<void> {
    const { prDetails, branches, integrationBranch, baseBranch, dryRun = false } = options;
    console.log(`[pr-titles.ts:52] branches: `, branches);
    const prBranches = branches.filter((branch) => branch !== baseBranch);
    console.log(`[pr-titles.ts:54] prBranches: `, prBranches);
    console.log(`[pr-titles.ts:55] integrationBranch: `, integrationBranch);
    console.log(`[pr-titles.ts:56] baseBranch: `, baseBranch);

    if (prBranches.length === 0) {
        console.log(chalk.yellow(MESSAGES.NO_PRS_TO_UPDATE));
        return;
    }

    console.log(chalk.blue(`\n${MESSAGES.UPDATING_PR_TITLES}`));

    // Get only PRs from integration branch to target branch (excluding integration branch itself)
    const targetBranches = getBranchesFromIntegrationToTarget(branches, integrationBranch);
    console.log(`🔍 Debug - Excluded branches for title updates: [${targetBranches.join(', ')}]`);
    const allChainPRs = Array.from(prDetails.values()).filter((pr) => !targetBranches.includes(pr.headRefName));

    // Get merged PRs that target the integration branch, but only those from target branches
    const mergedPRsToIntegration = await getMergedPRs(integrationBranch);
    console.log(
        `🔍 Debug - All merged PRs to integration: [${mergedPRsToIntegration.map((pr) => `${pr.headRefName}(#${pr.number})`).join(', ')}]`
    );

    const filteredMergedPRs = mergedPRsToIntegration.filter((pr) => targetBranches.includes(pr.headRefName));
    console.log(
        `🔍 Debug - Filtered merged PRs: [${filteredMergedPRs.map((pr) => `${pr.headRefName}(#${pr.number})`).join(', ')}]`
    );

    // Combine chain PRs and filtered merged PRs that target integration branch
    const allIntegrationBranchPRs = [...allChainPRs, ...filteredMergedPRs];
    console.log(
        `🔍 Debug - All PRs for numbering: [${allIntegrationBranchPRs.map((pr) => `${pr.headRefName}(#${pr.number})`).join(', ')}]`
    );

    // Remove duplicates (in case a PR appears in both lists)
    const uniquePRs = allIntegrationBranchPRs.filter(
        (pr, index, array) => array.findIndex((p) => p.number === pr.number) === index
    );

    const sortedPRs = sortPRsByMergeDateOrNumber(uniquePRs);
    const total = sortedPRs.length;
    let successCount = 0;

    for (let i = 0; i < sortedPRs.length; i++) {
        const pr = sortedPRs[i];
        if (!pr) continue;

        console.log(
            `🔍 Debug - Checking PR #${pr.number} (${pr.headRefName}): targetBranches.includes = ${targetBranches.includes(pr.headRefName)}`
        );

        // Only update open PRs (those from integration branch to target branch)
        console.log(`[pr-titles.ts:105] pr: `, pr);
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
