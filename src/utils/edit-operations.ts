import chalk from 'chalk';
import type { PullRequest, EditOperation } from '../types/index.js';
import { updatePRTitlesWithNumbers } from './pr-titles.js';
import { updatePRDescription } from '../services/github.js';
import { sortPRsByMergeDateOrNumber, filterPRsExcludingBaseBranch } from './pr-sorting.js';
import { VALID_EDIT_OPERATIONS, STATUS_ICONS, MESSAGES } from '../constants/index.js';

export async function executeEditOperations(
    operations: string[],
    prDetails: Map<string, PullRequest>,
    branches: string[],
    baseBranch: string,
    dryRun: boolean = false,
    integrationMode: boolean = false
): Promise<void> {
    if (operations.length === 0) {
        return;
    }

    // Validate operations
    const invalidOperations = operations.filter((op) => !VALID_EDIT_OPERATIONS.includes(op as EditOperation));

    if (invalidOperations.length > 0) {
        console.error(chalk.red(`${MESSAGES.INVALID_EDIT_OPERATIONS}: ${invalidOperations.join(', ')}`));
        console.log(chalk.yellow(`Valid operations: ${VALID_EDIT_OPERATIONS.join(', ')}`));
        return;
    }

    console.log(chalk.blue(`\n${MESSAGES.EXECUTING_EDIT_OPERATIONS}: ${operations.join(', ')}...`));

    for (const operation of operations) {
        await executeEditOperation(
            operation as EditOperation,
            prDetails,
            branches,
            baseBranch,
            dryRun,
            integrationMode
        );
    }
}

async function executeEditOperation(
    operation: EditOperation,
    prDetails: Map<string, PullRequest>,
    branches: string[],
    baseBranch: string,
    dryRun: boolean,
    integrationMode: boolean
): Promise<void> {
    switch (operation) {
        case 'title':
            // For title operation, always consider merged PRs for proper numbering
            await updatePRTitlesWithNumbers({
                prDetails,
                branches,
                baseBranch,
                dryRun,
                integration: true,
            });
            break;
        case 'integration':
            await updateIntegrationPRDescription(prDetails, branches, baseBranch, dryRun, integrationMode);
            break;
        default:
            console.error(chalk.red(`❌ Unknown edit operation: ${operation}`));
    }
}

async function updateIntegrationPRDescription(
    prDetails: Map<string, PullRequest>,
    branches: string[],
    baseBranch: string,
    dryRun: boolean,
    integrationMode: boolean
): Promise<void> {
    console.log(chalk.blue(`\n${MESSAGES.UPDATING_INTEGRATION_PR}`));

    // Find the integration branch PR (the one that merges into the base branch)
    let integrationPR: PullRequest | undefined;
    const prBranches = branches.filter((branch) => branch !== baseBranch);

    if (prBranches.length === 0) {
        console.log(chalk.yellow(MESSAGES.NO_PRS_TO_UPDATE));
        return;
    }

    // The integration PR is the first one in the chain (closest to base branch)
    const integrationBranch = prBranches[prBranches.length - 1];
    if (!integrationBranch) {
        console.error(chalk.red(MESSAGES.INTEGRATION_BRANCH_NOT_FOUND));
        return;
    }
    integrationPR = prDetails.get(integrationBranch);

    if (!integrationPR) {
        console.error(chalk.red(MESSAGES.INTEGRATION_PR_NOT_FOUND));
        return;
    }

    // Build PR list
    const prList = buildPRListMarkdown(prDetails, branches, baseBranch, integrationMode);

    // Get current PR details to read existing description
    const currentDescription = integrationPR.body || '';
    const newDescription = updateDescriptionWithPRList(currentDescription, prList);

    const success = await updatePRDescription(integrationPR.number, newDescription, dryRun);
    if (success) {
        console.log(chalk.green(`✓ Updated integration PR #${integrationPR.number} description`));
    }
}

function buildPRListMarkdown(
    prDetails: Map<string, PullRequest>,
    branches: string[],
    baseBranch: string,
    integrationMode: boolean
): string {
    const prBranches = branches.filter((branch) => branch !== baseBranch);

    if (integrationMode) {
        // Include all PRs (open and merged) sorted chronologically
        const allPRs = filterPRsExcludingBaseBranch(prDetails, baseBranch);
        const sortedPRs = sortPRsByMergeDateOrNumber(allPRs);

        const total = sortedPRs.length;
        return sortedPRs
            .map((pr, index) => {
                const position = index + 1;
                const status = prBranches.includes(pr.headRefName) ? 'open' : 'merged';
                const statusIcon = status === 'merged' ? STATUS_ICONS.MERGED_EMOJI : STATUS_ICONS.OPEN_EMOJI;
                return `- [${position}/${total}] ${statusIcon} #${pr.number}: [${pr.title}](${pr.url})`;
            })
            .join('\n');
    } else {
        // Only include open PRs in the current chain
        const reversedPRBranches = [...prBranches].reverse();
        const total = reversedPRBranches.length;

        return reversedPRBranches
            .map((branch, index) => {
                const pr = prDetails.get(branch);
                if (pr) {
                    const position = index + 1;
                    return `- [${position}/${total}] ${STATUS_ICONS.OPEN_EMOJI} #${pr.number}: [${pr.title}](${pr.url})`;
                }
                return '';
            })
            .filter((line) => line !== '')
            .join('\n');
    }
}

function updateDescriptionWithPRList(currentDescription: string, prList: string): string {
    const prListSection = `## PR Chain\n\n${prList}`;

    // Check if PR Chain section already exists
    const prChainRegex = /## PR Chain\n\n[\s\S]*?(?=\n## |\n# |$)/;

    if (prChainRegex.test(currentDescription)) {
        // Replace existing PR Chain section
        return currentDescription.replace(prChainRegex, prListSection);
    } else {
        // Add PR Chain section at the end
        return currentDescription ? `${currentDescription}\n\n${prListSection}` : prListSection;
    }
}
