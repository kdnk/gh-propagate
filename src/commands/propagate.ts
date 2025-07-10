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
    targetBranch: string,
    options: { dryRun?: boolean; edit?: string[]; integration?: string; debug?: boolean } = {}
): Promise<void> {
    const { dryRun = false, edit = [], integration, debug = false } = options;

    if (debug) {
        enableDebugLogging();
        logDebug(`Starting propagation to ${targetBranch}`);
        logDebug(`Options: dryRun=${dryRun}, edit=[${edit.join(', ')}], integration=${integration || 'none'}`);
    }

    // Validate integration branch is required for edit operations
    if (edit.length > 0 && !integration) {
        console.error(chalk.red('❌ --integration option is required when using --edit'));
        process.exit(1);
    }

    let baseBranch: string;
    let integrationPR: any = null;

    if (integration) {
        // Integration branch specified - validate it has a corresponding PR
        integrationPR = await getPullRequest(integration);
        if (!integrationPR) {
            console.error(
                chalk.red(
                    '❌ Integration branch PR not found. Make sure the integration branch has a corresponding PR.'
                )
            );
            process.exit(1);
        }
        baseBranch = integrationPR.baseRefName;
        logDebug(
            `Integration PR found: #${integrationPR.number} "${integrationPR.title}" (${integration} → ${baseBranch})`
        );
    } else {
        // Simple propagation - find base branch by traversing the PR chain
        let currentBranch = targetBranch;
        const targetPR = await getPullRequest(currentBranch);
        
        if (!targetPR) {
            // No PR found for target branch - it's likely the base branch itself
            console.error(
                chalk.red(
                    `❌ No pull request found for branch: ${targetBranch}. ` +
                    `This might be the base branch already, or the branch doesn't have a PR.`
                )
            );
            process.exit(1);
        }
        
        // Traverse the PR chain to find the base branch
        while (true) {
            const pr = await getPullRequest(currentBranch);
            if (!pr) {
                // No more PRs in chain, this is the base branch
                baseBranch = currentBranch;
                break;
            }
            currentBranch = pr.baseRefName;
        }
        logDebug(`Found base branch: ${baseBranch}`);
    }

    console.log(chalk.blue(`🔍 Building PR chain from ${chalk.cyan(baseBranch)} to ${chalk.cyan(targetBranch)}...`));

    // Include merged PRs only if integration is specified
    logDebug(`Building PR chain with integration mode: ${!!integration}`);
    const { branches, prUrls, prDetails } = await buildPRChain(targetBranch, baseBranch, {
        integration: !!integration,
        integrationBranch: integration,
    });
    logDebug(`Found ${branches.length} branches in chain: [${branches.join(', ')}]`);

    logChainDiscovery(branches);

    if (edit.length > 0 && integration) {
        logDebug(`Executing ${edit.length} edit operations: [${edit.join(', ')}]`);
        await executeEditOperations(edit, prDetails, branches, integration, baseBranch, dryRun);
    }

    const reversedChain = [...branches].reverse();
    logDebug(`Processing merge chain in reverse order: [${reversedChain.join(', ')}]`);

    for (let i = 0; i < reversedChain.length - 1; i++) {
        const sourceBranch = reversedChain[i];
        const targetBranchStep = reversedChain[i + 1];

        if (!sourceBranch || !targetBranchStep) {
            continue;
        }

        logMergeStep(i, reversedChain.length - 1, sourceBranch, targetBranchStep);
        logDebug(`Merging step ${i + 1}/${reversedChain.length - 1}: ${sourceBranch} → ${targetBranchStep}`);

        const targetUrl = prUrls.get(targetBranchStep);
        if (targetUrl) {
            logPRUrl(targetUrl);
            logDebug(`Target PR URL: ${targetUrl}`);
        }

        await executeGitCommand(`git switch ${sourceBranch}`, dryRun);
        await executeGitCommand(`git pull`, dryRun);
        await executeGitCommand(`git switch ${targetBranchStep}`, dryRun);
        await executeGitCommand(`git pull`, dryRun);
        await executeGitCommand(`git merge --no-ff ${sourceBranch}`, dryRun);
        await executeGitCommand(`git push`, dryRun);
    }

    logCompletionMessage(targetBranch, dryRun);
}
