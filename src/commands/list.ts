import chalk from 'chalk';
import { buildPRChain } from '../services/pr-chain.js';
import { sortPRsByMergeDateOrNumber, filterPRsExcludingBaseBranch } from '../utils/pr-sorting.js';
import { findIntegrationPR } from '../utils/edit-operations.js';
import { STATUS_ICONS, MESSAGES } from '../constants/index.js';
import { enableDebugLogging, logDebug } from '../utils/console.js';
import { getMergedPRs } from '../services/github.js';

export async function listPRChain(
    baseBranch: string,
    targetBranch: string,
    options: { debug?: boolean } = {}
): Promise<void> {
    const { debug = false } = options;

    if (debug) {
        enableDebugLogging();
        logDebug(`Starting list command from ${baseBranch} to ${targetBranch}`);
    }

    // Always use integration mode for accurate PR listing
    logDebug('Building PR chain with integration mode for listing');
    const { branches, prDetails } = await buildPRChain(targetBranch, baseBranch, { integration: true });
    logDebug(`Found ${branches.length} branches in chain: [${branches.join(', ')}]`);

    const prBranches = branches.filter((branch) => branch !== baseBranch);
    logDebug(`Filtered PR branches (excluding base): [${prBranches.join(', ')}]`);

    if (prBranches.length === 0) {
        logDebug('No PRs found in the chain');
        console.log(chalk.yellow(MESSAGES.NO_PRS_FOUND));
        return;
    }

    // Find the integration PR first
    logDebug('Finding integration PR');
    const integrationPR = findIntegrationPR(prDetails, branches, baseBranch);
    if (!integrationPR) {
        logDebug('No integration PR found');
        console.log(chalk.yellow('⚠️ No integration branch detected'));
        return;
    }
    logDebug(`Integration PR found: #${integrationPR.number} "${integrationPR.title}"`);

    // Get all PRs that merge directly into the integration branch (both open and merged)
    const integrationBranchName = integrationPR.headRefName;
    logDebug(`Looking for PRs that merge into integration branch: ${integrationBranchName}`);

    // Get merged PRs that target the integration branch
    const mergedPRsToIntegration = await getMergedPRs(integrationBranchName);
    logDebug(`Found ${mergedPRsToIntegration.length} merged PRs to integration branch`);

    // Get open PRs that target the integration branch
    const openPRsToIntegration = Array.from(prDetails.values()).filter(
        (pr) => pr.baseRefName === integrationBranchName
    );
    logDebug(`Found ${openPRsToIntegration.length} open PRs to integration branch`);

    // Combine open and merged PRs
    const allIntegrationBranchPRs = [...openPRsToIntegration, ...mergedPRsToIntegration];
    logDebug(`Total PRs targeting integration branch: ${allIntegrationBranchPRs.length}`);

    // Remove duplicates (in case a PR appears in both lists)
    const uniquePRs = allIntegrationBranchPRs.filter(
        (pr, index, array) => array.findIndex((p) => p.number === pr.number) === index
    );
    logDebug(`Unique PRs after deduplication: ${uniquePRs.length}`);

    const integrationBranchPRs = uniquePRs;

    const sortedPRs = sortPRsByMergeDateOrNumber(integrationBranchPRs);
    logDebug(`Sorted PRs for display: ${sortedPRs.map((pr) => `#${pr.number}`).join(', ')}`);

    const total = sortedPRs.length;
    sortedPRs.forEach((pr, index) => {
        const position = index + 1;
        const status = prBranches.includes(pr.headRefName) ? 'open' : 'merged';
        const statusIcon = status === 'merged' ? STATUS_ICONS.MERGED : STATUS_ICONS.OPEN;
        logDebug(`PR #${pr.number}: position=${position}/${total}, status=${status}`);
        console.log(`- [${position}/${total}] ${statusIcon} #${pr.number}: [${pr.title}](${pr.url})`);
    });
    logDebug('List command completed');
}
