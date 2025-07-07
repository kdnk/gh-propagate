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

    const integrationPR = findIntegrationPR(prDetails, branches, baseBranch);
    
    if (!integrationPR) {
        if (branches.filter((branch) => branch !== baseBranch).length === 0) {
            console.log(chalk.yellow(MESSAGES.NO_PRS_TO_UPDATE));
        } else {
            console.error(chalk.red(MESSAGES.INTEGRATION_PR_NOT_FOUND));
        }
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
    const prListSection = `## PRs\n\n${prList}`;

    // Split the description into lines for more precise processing
    const lines = currentDescription.split('\n');
    const filteredLines: string[] = [];
    let inPRsSection = false;

    for (const line of lines) {
        // Check if this line starts a PRs section
        if (line.match(/^## PRs\s*$/)) {
            inPRsSection = true;
            continue; // Skip this line
        }
        
        // Check if this line starts a new section (ends PRs section)
        if (line.match(/^## .+/) || line.match(/^# .+/)) {
            inPRsSection = false;
        }
        
        // Keep lines that are not in PRs section
        if (!inPRsSection) {
            filteredLines.push(line);
        }
    }

    // Join the remaining lines and trim
    const cleanedDescription = filteredLines.join('\n').trim();

    // Add new PRs section at the end
    return cleanedDescription ? `${cleanedDescription}\n\n${prListSection}` : prListSection;
}

export function findIntegrationPR(
    prDetails: Map<string, PullRequest>,
    branches: string[],
    baseBranch: string
): PullRequest | null {
    // Find the PR that merges directly into the base branch (integration branch)
    // This is determined by finding which branch in our chain has the baseBranch as its base
    const prBranches = branches.filter((branch) => branch !== baseBranch);
    
    for (const branch of prBranches) {
        const pr = prDetails.get(branch);
        if (pr && pr.baseRefName === baseBranch) {
            return pr;
        }
    }
    
    return null;
}
