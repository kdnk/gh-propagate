import chalk from 'chalk';
import { buildPRChain } from '../services/pr-chain.js';
import { sortPRsByMergeDateOrNumber, filterPRsExcludingBaseBranch } from '../utils/pr-sorting.js';
import { STATUS_ICONS, MESSAGES } from '../constants/index.js';
import { enableDebugLogging, logDebug } from '../utils/console.js';
import { getMergedPRs, getPullRequest } from '../services/github.js';

export async function listPRChain(
    integrationBranch: string,
    targetBranch: string,
    options: { debug?: boolean } = {}
): Promise<void> {
    const { debug = false } = options;

    if (debug) {
        enableDebugLogging();
        logDebug(`Starting list command for integration branch ${integrationBranch} to ${targetBranch}`);
    }

    // First, get the integration PR to find the base branch
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

    // Build PR chain from target to base
    logDebug('Building PR chain from target to base');
    const { branches, prDetails } = await buildPRChain(targetBranch, baseBranch, {
        integration: true,
        integrationBranch,
    });
    logDebug(`Found ${branches.length} branches in chain: [${branches.join(', ')}]`);

    // Get all PRs that merge directly into the integration branch (both open and merged)
    logDebug(`Looking for PRs that merge into integration branch: ${integrationBranch}`);

    // Get merged PRs that target the integration branch
    const mergedPRsToIntegration = await getMergedPRs(integrationBranch);
    logDebug(`Found ${mergedPRsToIntegration.length} merged PRs to integration branch`);

    // Get open PRs that target the integration branch
    const openPRsToIntegration = Array.from(prDetails.values()).filter((pr) => pr.baseRefName === integrationBranch);
    logDebug(`Found ${openPRsToIntegration.length} open PRs to integration branch`);

    // Combine open and merged PRs
    const allIntegrationBranchPRs = [...openPRsToIntegration, ...mergedPRsToIntegration];
    logDebug(`Total PRs targeting integration branch: ${allIntegrationBranchPRs.length}`);

    // Remove duplicates (in case a PR appears in both lists)
    const uniquePRs = allIntegrationBranchPRs.filter(
        (pr, index, array) => array.findIndex((p) => p.number === pr.number) === index
    );
    logDebug(`Unique PRs after deduplication: ${uniquePRs.length}`);

    if (uniquePRs.length === 0) {
        logDebug('No PRs found that merge into integration branch');
        console.log(chalk.yellow(MESSAGES.NO_PRS_FOUND));
        return;
    }

    const sortedPRs = sortPRsByMergeDateOrNumber(uniquePRs);
    logDebug(`Sorted PRs for display: ${sortedPRs.map((pr) => `#${pr.number}`).join(', ')}`);

    const prBranches = branches.filter((branch) => branch !== baseBranch);
    const total = sortedPRs.length;
    sortedPRs.forEach((pr, index) => {
        const position = index + 1;
        const status = pr.state === 'merged' ? 'merged' : 'open';
        const statusIcon = status === 'merged' ? STATUS_ICONS.MERGED : STATUS_ICONS.OPEN;
        logDebug(`PR #${pr.number}: position=${position}/${total}, status=${status}`);
        console.log(`- [${position}/${total}] ${statusIcon} #${pr.number}: [${pr.title}](${pr.url})`);
    });
    logDebug('List command completed');
}
