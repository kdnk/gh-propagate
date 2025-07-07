import chalk from 'chalk';
import { buildPRChain } from '../services/pr-chain.js';
import { executeGitCommand } from '../services/git.js';
import { executeEditOperations } from '../utils/edit-operations.js';
import { logChainDiscovery, logMergeStep, logPRUrl, logCompletionMessage } from '../utils/console.js';

export async function propagateChanges(
    baseBranch: string,
    targetBranch: string,
    options: { dryRun?: boolean; edit?: string[] } = {}
): Promise<void> {
    const { dryRun = false, edit = [] } = options;
    
    console.log(chalk.blue(`🔍 Building PR chain from ${chalk.cyan(baseBranch)} to ${chalk.cyan(targetBranch)}...`));

    // Always include merged PRs for accurate PR chain and numbering
    const { branches, prUrls, prDetails } = await buildPRChain(targetBranch, baseBranch, {
        integration: true,
    });

    logChainDiscovery(branches);

    if (edit.length > 0) {
        await executeEditOperations(edit, prDetails, branches, baseBranch, dryRun, true);
    }


    if (dryRun) {
        console.log(chalk.yellow(`🔍 DRY RUN MODE: Showing what would be executed without making changes\n`));
    }

    const reversedChain = [...branches].reverse();

    for (let i = 0; i < reversedChain.length - 1; i++) {
        const sourceBranch = reversedChain[i];
        const targetBranch = reversedChain[i + 1];

        if (!sourceBranch || !targetBranch) {
            continue;
        }

        logMergeStep(i, reversedChain.length - 1, sourceBranch, targetBranch);

        const targetUrl = prUrls.get(targetBranch);
        if (targetUrl) {
            logPRUrl(targetUrl);
        }

        await executeGitCommand(`git switch ${sourceBranch}`, dryRun);
        await executeGitCommand(`git pull`, dryRun);
        await executeGitCommand(`git switch ${targetBranch}`, dryRun);
        await executeGitCommand(`git pull`, dryRun);
        await executeGitCommand(`git merge --no-ff ${sourceBranch}`, dryRun);
        await executeGitCommand(`git push`, dryRun);
    }

    logCompletionMessage(targetBranch, dryRun);
}
