import { $ } from 'bun';
import type { PullRequest } from '../types/index.js';

export async function getPullRequest(branch: string): Promise<PullRequest | null> {
    try {
        const result = await $`gh pr view --json number,headRefName,baseRefName,url,title ${branch}`.text();
        return JSON.parse(result);
    } catch (error) {
        return null;
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
        console.error(`❌ Failed to update PR #${prNumber} title:`, error instanceof Error ? error.message : String(error));
        return false;
    }
}