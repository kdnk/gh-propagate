import chalk from 'chalk';
import { buildPRChain } from '../services/pr-chain.js';
import { executeGitCommand } from '../services/git.js';
import { getPullRequest } from '../services/github.js';
import { executeEditOperations } from '../utils/edit-operations.js';
import {
    logChainDiscovery,
    logMergeStep,
    logPRUrl,
    logCompletionMessage,
    enableDebugLogging,
    logDebug,
} from '../utils/console.js';

export async function propagateChanges(
    integrationBranch: string,
    targetBranch: string,
    options: { dryRun?: boolean; edit?: string[]; debug?: boolean } = {}
): Promise<void> {
    const { dryRun = false, edit = [], debug = false } = options;

    if (debug) {
        enableDebugLogging();
        logDebug(`Starting propagation from integration branch ${integrationBranch} to ${targetBranch}`);
        logDebug(`Options: dryRun=${dryRun}, edit=[${edit.join(', ')}]`);
    }

    // First, validate that the integration branch has a corresponding PR
    const integrationPR = await getPullRequest(integrationBranch);
    if (!integrationPR) {
        console.error(
            chalk.red('❌ Integration branch PR not found. Make sure the integration branch has a corresponding PR.')
        );
        process.exit(1);
    }

    const baseBranch = integrationPR.baseRefName;
    logDebug(
        `Integration PR found: #${integrationPR.number} "${integrationPR.title}" (${integrationBranch} → ${baseBranch})`
    );

    console.log(
        chalk.blue(`🔍 Building PR chain from ${chalk.cyan(integrationBranch)} to ${chalk.cyan(targetBranch)}...`)
    );

    // Always include merged PRs for accurate PR chain and numbering
    logDebug('Building PR chain with integration mode enabled');
    const { branches, prUrls, prDetails } = await buildPRChain(targetBranch, baseBranch, {
        integration: true,
        integrationBranch,
    });
    logDebug(`Found ${branches.length} branches in chain: [${branches.join(', ')}]`);

    logChainDiscovery(branches);

    if (edit.length > 0) {
        logDebug(`Executing ${edit.length} edit operations: [${edit.join(', ')}]`);
        await executeEditOperations(edit, prDetails, branches, integrationBranch, baseBranch, dryRun);
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
