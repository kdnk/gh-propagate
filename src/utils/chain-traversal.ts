import chalk from 'chalk';
import { getPullRequest } from '../services/github.js';
import { COMMON_BASE_BRANCHES } from '../constants/index.js';
import { logDebug } from './console.js';

export interface FindBaseBranchOptions {
    targetBranch: string;
    integrationMode?: boolean;
}

export async function findBaseBranch(options: FindBaseBranchOptions): Promise<string> {
    const { targetBranch, integrationMode = false } = options;
    let currentBranch = targetBranch;

    // Traverse the PR chain to find the base branch
    while (true) {
        const pr = await getPullRequest(currentBranch);
        if (!pr) {
            // No more PRs in chain, this is the base branch
            if (currentBranch === targetBranch) {
                // No PR found for target branch - it's likely the base branch itself
                console.error(
                    chalk.red(
                        `❌ No pull request found for branch: ${targetBranch}. ` +
                            `This might be the base branch already, or the branch doesn't have a PR.`
                    )
                );
                process.exit(1);
            }
            logDebug(`Found base branch ${integrationMode ? 'for integration mode' : ''}: ${currentBranch}`);
            return currentBranch;
        }
        currentBranch = pr.baseRefName;

        // Check if we've reached a common base branch
        if (COMMON_BASE_BRANCHES.includes(currentBranch as any)) {
            logDebug(`Reached common base branch: ${currentBranch}`);
            logDebug(`Found base branch ${integrationMode ? 'for integration mode' : ''}: ${currentBranch}`);
            return currentBranch;
        }
    }
}
