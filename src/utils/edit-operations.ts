import chalk from 'chalk';
import type { PullRequest, EditOperation } from '../types/index.js';
import { updatePRTitlesWithNumbers } from './pr-titles.js';
import { updatePRDescription } from '../services/github.js';

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
    const validOperations: EditOperation[] = ['title', 'integration'];
    const invalidOperations = operations.filter(op => !validOperations.includes(op as EditOperation));
    
    if (invalidOperations.length > 0) {
        console.error(chalk.red(`❌ Invalid edit operations: ${invalidOperations.join(', ')}`));
        console.log(chalk.yellow(`Valid operations: ${validOperations.join(', ')}`));
        return;
    }

    console.log(chalk.blue(`\n🛠️  Executing edit operations: ${operations.join(', ')}...`));

    for (const operation of operations) {
        await executeEditOperation(operation as EditOperation, prDetails, branches, baseBranch, dryRun, integrationMode);
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
            await updatePRTitlesWithNumbers(prDetails, branches, baseBranch, dryRun, true);
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
    console.log(chalk.blue(`\n📝 Updating integration PR description with PR chain...`));

    // Find the integration branch PR (the one that merges into the base branch)
    let integrationPR: PullRequest | undefined;
    const prBranches = branches.filter(branch => branch !== baseBranch);
    
    if (prBranches.length === 0) {
        console.log(chalk.yellow('No PRs found to update'));
        return;
    }

    // The integration PR is the first one in the chain (closest to base branch)
    const integrationBranch = prBranches[0];
    if (!integrationBranch) {
        console.error(chalk.red('❌ Could not find integration branch'));
        return;
    }
    integrationPR = prDetails.get(integrationBranch);

    if (!integrationPR) {
        console.error(chalk.red('❌ Could not find integration PR'));
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
    const prBranches = branches.filter(branch => branch !== baseBranch);
    
    if (integrationMode) {
        // Include all PRs (open and merged) sorted chronologically
        const allPRs = Array.from(prDetails.values()).filter(pr => pr.headRefName !== baseBranch);
        const sortedPRs = allPRs.sort((a, b) => {
            if ('mergedAt' in a && 'mergedAt' in b) {
                return new Date(a.mergedAt as string).getTime() - new Date(b.mergedAt as string).getTime();
            }
            return a.number - b.number;
        });

        const total = sortedPRs.length;
        return sortedPRs.map((pr, index) => {
            const position = index + 1;
            const status = prBranches.includes(pr.headRefName) ? 'open' : 'merged';
            const statusIcon = status === 'merged' ? '✅' : '🔄';
            return `- [${position}/${total}] ${statusIcon} #${pr.number}: [${pr.title}](${pr.url})`;
        }).join('\n');
    } else {
        // Only include open PRs in the current chain
        const reversedPRBranches = [...prBranches].reverse();
        const total = reversedPRBranches.length;
        
        return reversedPRBranches.map((branch, index) => {
            const pr = prDetails.get(branch);
            if (pr) {
                const position = index + 1;
                return `- [${position}/${total}] 🔄 #${pr.number}: [${pr.title}](${pr.url})`;
            }
            return '';
        }).filter(line => line !== '').join('\n');
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
