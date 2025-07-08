import chalk from 'chalk';
import { buildPRChain } from '../services/pr-chain.js';
import { executeGitCommand } from '../services/git.js';
import { executeEditOperations, findIntegrationPR } from '../utils/edit-operations.js';
import {
    logChainDiscovery,
    logMergeStep,
    logPRUrl,
    logCompletionMessage,
    enableDebugLogging,
    logDebug,
} from '../utils/console.js';

export async function propagateChanges(
    baseBranch: string,
    targetBranch: string,
    options: { dryRun?: boolean; edit?: string[]; debug?: boolean } = {}
): Promise<void> {
    const { dryRun = false, edit = [], debug = false } = options;

    if (debug) {
        enableDebugLogging();
        logDebug(`Starting propagation from ${baseBranch} to ${targetBranch}`);
        logDebug(`Options: dryRun=${dryRun}, edit=[${edit.join(', ')}]`);
    }

    console.log(chalk.blue(`🔍 Building PR chain from ${chalk.cyan(baseBranch)} to ${chalk.cyan(targetBranch)}...`));

    // Always include merged PRs for accurate PR chain and numbering
    logDebug('Building PR chain with integration mode enabled');
    const { branches, prUrls, prDetails } = await buildPRChain(targetBranch, baseBranch, {
        integration: true,
    });
    logDebug(`Found ${branches.length} branches in chain: [${branches.join(', ')}]`);

    logChainDiscovery(branches);

    if (edit.length > 0) {
        logDebug(`Executing ${edit.length} edit operations: [${edit.join(', ')}]`);
        await executeEditOperations(edit, prDetails, branches, baseBranch, dryRun, true);
    }

    const reversedChain = [...branches].reverse();
    logDebug(`Processing merge chain in reverse order: [${reversedChain.join(', ')}]`);

    for (let i = 0; i < reversedChain.length - 1; i++) {
        const sourceBranch = reversedChain[i];
        const targetBranch = reversedChain[i + 1];

        if (!sourceBranch || !targetBranch) {
            continue;
        }

        logMergeStep(i, reversedChain.length - 1, sourceBranch, targetBranch);
        logDebug(`Merging step ${i + 1}/${reversedChain.length - 1}: ${sourceBranch} → ${targetBranch}`);

        const targetUrl = prUrls.get(targetBranch);
        if (targetUrl) {
            logPRUrl(targetUrl);
            logDebug(`Target PR URL: ${targetUrl}`);
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
