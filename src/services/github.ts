import { $ } from 'bun';
import type { PullRequest } from '../types/index.js';

export async function getPullRequest(branch: string): Promise<PullRequest | null> {
    try {
        const result = await $`gh pr view --json number,headRefName,baseRefName,url,title,body ${branch}`.text();
        return JSON.parse(result);
    } catch (error) {
        return null;
    }
}

export async function getMergedPRs(baseBranch: string): Promise<PullRequest[]> {
    try {
        const result =
            await $`gh pr list --state merged --base ${baseBranch} --json number,headRefName,baseRefName,url,title,mergedAt`.text();
        const prs = JSON.parse(result);
        return prs.sort((a: any, b: any) => new Date(a.mergedAt).getTime() - new Date(b.mergedAt).getTime());
    } catch (error) {
        console.error('Failed to get merged PRs:', error);
        return [];
    }
}

export async function updatePRTitle(prNumber: number, newTitle: string, dryRun: boolean = false): Promise<boolean> {
    try {
        if (dryRun) {
            console.log(`[DRY RUN] Would update PR #${prNumber} title to: "${newTitle}"`);
            return true;
        } else {
            await $`gh pr edit ${prNumber} --title ${newTitle}`.quiet();
            return true;
        }
    } catch (error) {
        console.error(
            `❌ Failed to update PR #${prNumber} title:`,
            error instanceof Error ? error.message : String(error)
        );
        return false;
    }
}

export async function updatePRDescription(
    prNumber: number,
    newDescription: string,
    dryRun: boolean = false
): Promise<boolean> {
    try {
        if (dryRun) {
            console.log(`[DRY RUN] Would update PR #${prNumber} description`);
            return true;
        } else {
            await $`gh pr edit ${prNumber} --body ${newDescription}`.quiet();
            return true;
        }
    } catch (error) {
        console.error(
            `❌ Failed to update PR #${prNumber} description:`,
            error instanceof Error ? error.message : String(error)
        );
        return false;
    }
}
