import chalk from 'chalk';
import { buildPRChain } from '../services/pr-chain.js';
import { executeGitCommand, executeMergeOperation } from '../services/git.js';
import { getPullRequest } from '../services/github.js';
import { executeEditOperations } from '../utils/edit-operations.js';
import { findBaseBranch } from '../utils/chain-traversal.js';
import {
    logChainDiscovery,
    logMergeStep,
    logPRUrl,
    logCompletionMessage,
    enableDebugLogging,
    logDebug,
} from '../utils/console.js';
import type { PropagateOptions, ChainInfo } from '../types/index.js';

interface PropagateContext {
    targetBranch: string;
    options: PropagateOptions;
    baseBranch: string;
    integrationPR: any;
}

function validateAndSetupLogging(targetBranch: string, options: PropagateOptions): void {
    const { dryRun = false, edit = [], integration, debug = false } = options;

    if (debug) {
        enableDebugLogging();
        logDebug(`Starting propagation to ${targetBranch}`);
        logDebug(`Options: dryRun=${dryRun}, edit=[${edit.join(', ')}], integration=${integration || 'none'}`);
    }

    // Validate integration and edit options are used together
    if (edit.length > 0 && !integration) {
        console.error(chalk.red('❌ --integration option is required when using --edit'));
        process.exit(1);
    }

    if (integration && edit.length === 0) {
        console.error(chalk.red('❌ --edit option is required when using --integration'));
        process.exit(1);
    }
}

async function validateIntegrationPR(integration: string): Promise<any> {
    const integrationPR = await getPullRequest(integration);
    if (!integrationPR) {
        console.error(
            chalk.red('❌ Integration branch PR not found. Make sure the integration branch has a corresponding PR.')
        );
        process.exit(1);
    }
    logDebug(
        `Integration PR found: #${integrationPR.number} "${integrationPR.title}" (${integration} → ${integrationPR.baseRefName})`
    );
    return integrationPR;
}

async function determineBaseBranch(targetBranch: string, integration?: string): Promise<string> {
    if (integration) {
        return await findBaseBranch({ targetBranch, integrationMode: true });
    } else {
        return await findBaseBranch({ targetBranch, integrationMode: false });
    }
}

async function buildChainInfo(targetBranch: string, baseBranch: string, integration?: string): Promise<ChainInfo> {
    console.log(chalk.blue(`🔍 Building PR chain from ${chalk.cyan(baseBranch)} to ${chalk.cyan(targetBranch)}...`));

    logDebug(`Building PR chain with integration mode: ${!!integration}`);
    const { branches, prUrls, prDetails } = await buildPRChain(targetBranch, baseBranch, {
        integration: !!integration,
        integrationBranch: integration,
    });
    logDebug(`Found ${branches.length} branches in chain: [${branches.join(', ')}]`);

    logChainDiscovery(branches);

    return { branches, prUrls, prDetails };
}

async function executeMergeChain(chainInfo: ChainInfo, dryRun: boolean): Promise<void> {
    const { branches, prUrls } = chainInfo;
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

        await executeMergeOperation(sourceBranch, targetBranchStep, dryRun);
    }
}

export async function propagateChanges(targetBranch: string, options: PropagateOptions = {}): Promise<void> {
    const { dryRun = false, edit = [], integration, debug = false } = options;

    validateAndSetupLogging(targetBranch, options);

    let integrationPR: any = null;
    if (integration) {
        integrationPR = await validateIntegrationPR(integration);
    }

    const baseBranch = await determineBaseBranch(targetBranch, integration);

    const chainInfo = await buildChainInfo(targetBranch, baseBranch, integration);

    if (edit.length > 0 && integration) {
        await executeEditOperations(edit, chainInfo.prDetails, chainInfo.branches, integration, baseBranch, dryRun);
    }

    await executeMergeChain(chainInfo, dryRun);

    logCompletionMessage(targetBranch, dryRun);
}
