import { $ } from 'bun';
import type { PullRequest } from '../types/index.js';
import chalk from 'chalk';
import { logAPICall, logDebug } from '../utils/console.js';

export async function getPullRequest(branch: string): Promise<PullRequest | null> {
    try {
        logAPICall(`gh pr view ${branch}`);
        const result = await $`gh pr view --json number,headRefName,baseRefName,url,title,body ${branch}`.text();
        const pr = JSON.parse(result);
        logDebug(`Retrieved PR for branch ${branch}: #${pr.number} "${pr.title}"`);
        return pr;
    } catch (error) {
        logDebug(`No PR found for branch ${branch}: ${error instanceof Error ? error.message : String(error)}`);
        return null;
    }
}

export async function getMergedPRs(baseBranch: string): Promise<PullRequest[]> {
    try {
        logAPICall(`gh pr list --state merged --base ${baseBranch}`);
        const result =
            await $`gh pr list --state merged --base ${baseBranch} --json number,headRefName,baseRefName,url,title,mergedAt`.text();
        const prs = JSON.parse(result);
        const sortedPrs = prs.sort((a: any, b: any) => new Date(a.mergedAt).getTime() - new Date(b.mergedAt).getTime());
        logDebug(`Retrieved ${sortedPrs.length} merged PRs for base branch ${baseBranch}`);
        return sortedPrs;
    } catch (error) {
        console.error('Failed to get merged PRs:', error);
        logDebug(`Failed to retrieve merged PRs: ${error instanceof Error ? error.message : String(error)}`);
        return [];
    }
}

export async function updatePRTitle(prNumber: number, newTitle: string, dryRun: boolean = false): Promise<boolean> {
    try {
        logDebug(`Updating PR #${prNumber} title to: "${newTitle}"`);
        if (dryRun) {
            console.log(chalk.yellow(`[DRY RUN] Would update PR #${prNumber} title to: "${newTitle}"`));
            return true;
        } else {
            logAPICall(`gh pr edit ${prNumber} --title`);
            await $`gh pr edit ${prNumber} --title ${newTitle}`.quiet();
            console.log(chalk.green(`✅ PR #${prNumber}: "${newTitle}"`));
            logDebug(`Successfully updated PR #${prNumber} title`);
            return true;
        }
    } catch (error) {
        console.error(
            `❌ Failed to update PR #${prNumber} title:`,
            error instanceof Error ? error.message : String(error)
        );
        logDebug(`Failed to update PR #${prNumber} title: ${error instanceof Error ? error.message : String(error)}`);
        return false;
    }
}

export async function updatePRDescription(
    prNumber: number,
    newDescription: string,
    dryRun: boolean = false
): Promise<boolean> {
    try {
        logDebug(`Updating PR #${prNumber} description (${newDescription.length} characters)`);
        if (dryRun) {
            console.log(chalk.yellow(`[DRY RUN] Would update PR #${prNumber} description`));
            return true;
        } else {
            logAPICall(`gh pr edit ${prNumber} --body`);
            await $`gh pr edit ${prNumber} --body ${newDescription}`.quiet();
            console.log(chalk.green(`✅ Updated integration PR #${prNumber} description`));
            logDebug(`Successfully updated PR #${prNumber} description`);
            return true;
        }
    } catch (error) {
        console.error(
            `❌ Failed to update PR #${prNumber} description:`,
            error instanceof Error ? error.message : String(error)
        );
        logDebug(
            `Failed to update PR #${prNumber} description: ${error instanceof Error ? error.message : String(error)}`
        );
        return false;
    }
}
