import { $ } from 'bun';
import type { PullRequest } from '../types/index.js';
import chalk from 'chalk';
import { logAPICall, logDebug, formatErrorMessage, logDryRun } from '../utils/console.js';

export async function getPullRequest(branch: string): Promise<PullRequest | null> {
    try {
        logAPICall(`gh pr view ${branch}`);
        const result = await $`gh pr view --json number,headRefName,baseRefName,url,title,body,state ${branch}`.text();
        const pr = JSON.parse(result);
        logDebug(`Retrieved PR for branch ${branch}: #${pr.number} "${pr.title}" (${pr.state})`);
        return pr;
    } catch (error) {
        logDebug(`No PR found for branch ${branch}: ${formatErrorMessage(error)}`);
        return null;
    }
}

export async function getMergedPRs(baseBranch: string): Promise<PullRequest[]> {
    try {
        logAPICall(`gh pr list --state merged --base ${baseBranch}`);
        const result =
            await $`gh pr list --state merged --base ${baseBranch} --json number,headRefName,baseRefName,url,title,mergedAt,state`.text();
        const prs = JSON.parse(result);
        const sortedPrs = prs.sort((a: any, b: any) => new Date(a.mergedAt).getTime() - new Date(b.mergedAt).getTime());
        logDebug(`Retrieved ${sortedPrs.length} merged PRs for base branch ${baseBranch}`);
        return sortedPrs;
    } catch (error) {
        console.error('Failed to get merged PRs:', error);
        logDebug(`Failed to retrieve merged PRs: ${formatErrorMessage(error)}`);
        return [];
    }
}

export async function updatePRTitle(prNumber: number, newTitle: string, dryRun: boolean = false): Promise<boolean> {
    try {
        logDebug(`Updating PR #${prNumber} title to: "${newTitle}"`);
        if (dryRun) {
            logDryRun('Would update PR title', `#${prNumber} to: "${newTitle}"`);
            return true;
        } else {
            logAPICall(`gh pr edit ${prNumber} --title`);
            await $`gh pr edit ${prNumber} --title ${newTitle}`.quiet();
            console.log(chalk.green(`✅ PR #${prNumber}: "${newTitle}"`));
            logDebug(`Successfully updated PR #${prNumber} title`);
            return true;
        }
    } catch (error) {
        console.error(`❌ Failed to update PR #${prNumber} title:`, formatErrorMessage(error));
        logDebug(`Failed to update PR #${prNumber} title: ${formatErrorMessage(error)}`);
        return false;
    }
}

export async function updatePRDescription(
    prNumber: number,
    newDescription: string,
    dryRun: boolean = false,
    url?: string
): Promise<boolean> {
    try {
        logDebug(`Updating PR #${prNumber} description (${newDescription.length} characters)`);
        const urlSuffix = url ? ` ${url}` : '';
        if (dryRun) {
            logDryRun('Would update PR description', `#${prNumber}${urlSuffix}`);
            return true;
        } else {
            logAPICall(`gh pr edit ${prNumber} --body`);
            await $`gh pr edit ${prNumber} --body ${newDescription}`.quiet();
            console.log(chalk.green(`✅ Updated integration PR #${prNumber} description${urlSuffix}`));
            logDebug(`Successfully updated PR #${prNumber} description`);
            return true;
        }
    } catch (error) {
        console.error(`❌ Failed to update PR #${prNumber} description:`, formatErrorMessage(error));
        logDebug(`Failed to update PR #${prNumber} description: ${formatErrorMessage(error)}`);
        return false;
    }
}

export async function updatePRBranch(
    prNumber: number,
    headBranch: string,
    dryRun: boolean = false
): Promise<boolean> {
    try {
        logDebug(`Updating PR #${prNumber} branch with base branch changes`);
        if (dryRun) {
            logDryRun('Would update PR branch', `#${prNumber}`);
            logDryRun('Would fetch', `origin/${headBranch}`);
            return true;
        } else {
            logAPICall(`gh pr update-branch ${prNumber}`);
            await $`gh pr update-branch ${prNumber}`.quiet();
            console.log(chalk.green(`✅ Updated PR #${prNumber} branch`));

            // Sync local branch with remote
            logDebug(`Fetching origin/${headBranch} to local`);
            await $`git fetch origin ${headBranch}:${headBranch}`.quiet();
            console.log(chalk.gray(`   Fetched origin/${headBranch}`));

            logDebug(`Successfully updated PR #${prNumber} branch`);
            return true;
        }
    } catch (error) {
        console.error(`❌ Failed to update PR #${prNumber} branch:`, formatErrorMessage(error));
        logDebug(`Failed to update PR #${prNumber} branch: ${formatErrorMessage(error)}`);
        return false;
    }
}
