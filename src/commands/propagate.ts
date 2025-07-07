import chalk from 'chalk';
import { buildPRChain } from '../services/pr-chain.js';
import { executeGitCommand } from '../services/git.js';
import { executeEditOperations } from '../utils/edit-operations.js';
import { logChainDiscovery, logMergeStep, logPRUrl, logCompletionMessage } from '../utils/console.js';

export async function propagateChanges(
    baseBranch: string,
    targetBranch: string,
    options: { dryRun?: boolean; edit?: string[]; integration?: boolean } = {}
): Promise<void> {
    const { dryRun = false, edit = [], integration = false } = options;
    console.log(chalk.blue(`🔍 Building PR chain from ${chalk.cyan(baseBranch)} to ${chalk.cyan(targetBranch)}...`));

    // If title edit is requested, we need to include merged PRs for proper numbering
    const needsMergedPRs = integration || edit.includes('title');
    const { branches, prUrls, prDetails } = await buildPRChain(targetBranch, baseBranch, {
        integration: needsMergedPRs,
    });

    if (edit.length > 0) {
        await executeEditOperations(edit, prDetails, branches, baseBranch, dryRun, needsMergedPRs);
    }

    logChainDiscovery(branches);

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
