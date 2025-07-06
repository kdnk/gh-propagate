#!/usr/bin/env bun

import { $ } from 'bun';
import chalk from 'chalk';
import { Command } from 'commander';

interface PullRequest {
    number: number;
    headRefName: string;
    baseRefName: string;
    url: string;
    title: string;
}

interface PropagateOptions {
    dryRun?: boolean;
    list?: boolean;
    numberTitles?: boolean;
}

async function getPullRequest(branch: string): Promise<PullRequest | null> {
    try {
        const result = await $`gh pr view --json number,headRefName,baseRefName,url,title ${branch}`.text();
        return JSON.parse(result);
    } catch (error) {
        return null;
    }
}

interface ChainInfo {
    branches: string[];
    prUrls: Map<string, string>;
    prDetails: Map<string, PullRequest>;
}

async function buildPRChain(startBranch: string, baseBranch: string): Promise<ChainInfo> {
    const branches: string[] = [];
    const prUrls = new Map<string, string>();
    const prDetails = new Map<string, PullRequest>();
    let currentBranch = startBranch;

    while (currentBranch !== baseBranch) {
        const pr = await getPullRequest(currentBranch);
        if (!pr) {
            throw new Error(`No pull request found for branch: ${currentBranch}`);
        }

        branches.push(currentBranch);
        prUrls.set(currentBranch, pr.url);
        prDetails.set(currentBranch, pr);
        currentBranch = pr.baseRefName;
    }

    branches.push(baseBranch);
    return { branches, prUrls, prDetails };
}

async function executeGitCommand(command: string, dryRun: boolean = false): Promise<void> {
    if (dryRun) {
        console.log(chalk.yellow(`[DRY RUN] Would execute: ${command}`));
    } else {
        console.log(chalk.white(`⏳ Executing: ${command}`));
        const result = await $`${{ raw: command }}`.quiet();
        const stderr = result.stderr.toString().trim();
        const stdout = result.stdout.toString().trim();
        if (stderr) {
            console.log(chalk.gray(stderr));
        }
        if (stdout) {
            console.log(chalk.gray(stdout));
        }
    }
}

function removeExistingNumberPrefix(title: string): string {
    // Remove existing [n/total] prefix if present
    return title.replace(/^\[\d+\/\d+\]/, '');
}

function addNumberPrefix(title: string, position: number, total: number): string {
    const cleanTitle = removeExistingNumberPrefix(title);
    const prefix = `[${position}/${total}]`;
    
    // If the title starts with brackets (after removing numbering), don't add space
    if (cleanTitle.startsWith('[')) {
        return `${prefix}${cleanTitle}`;
    }
    
    // Otherwise, add space
    return `${prefix} ${cleanTitle}`;
}

async function updatePRTitle(prNumber: number, newTitle: string, dryRun: boolean = false): Promise<boolean> {
    try {
        if (dryRun) {
            console.log(chalk.yellow(`[DRY RUN] Would update PR #${prNumber} title to: "${newTitle}"`));
            return true;
        } else {
            await $`gh pr edit ${prNumber} --title ${newTitle}`.quiet();
            return true;
        }
    } catch (error) {
        console.error(chalk.red(`❌ Failed to update PR #${prNumber} title:`, error instanceof Error ? error.message : String(error)));
        return false;
    }
}

async function updatePRTitlesWithNumbers(prDetails: Map<string, PullRequest>, branches: string[], baseBranch: string, dryRun: boolean = false): Promise<void> {
    const prBranches = branches.filter(branch => branch !== baseBranch);
    
    if (prBranches.length === 0) {
        console.log(chalk.yellow('No PRs found to update'));
        return;
    }

    console.log(chalk.blue(`\n🔢 Updating PR titles with sequential numbering...`));
    
    const reversedPRBranches = [...prBranches].reverse();
    const total = reversedPRBranches.length;
    let successCount = 0;
    
    for (let i = 0; i < reversedPRBranches.length; i++) {
        const branch = reversedPRBranches[i];
        const pr = prDetails.get(branch);
        
        if (pr) {
            const position = i + 1;
            const newTitle = addNumberPrefix(pr.title, position, total);
            
            const success = await updatePRTitle(pr.number, newTitle, dryRun);
            if (success) {
                console.log(chalk.green(`✓ PR #${pr.number}: "${newTitle}"`));
                successCount++;
            }
        }
    }
    
    console.log(chalk.green(`\n✅ Updated ${successCount}/${total} PR titles successfully`));
}

async function listPRChain(baseBranch: string, targetBranch: string): Promise<void> {
    console.log(chalk.blue(`🔍 Building PR chain from ${chalk.cyan(baseBranch)} to ${chalk.cyan(targetBranch)}...`));

    const { branches, prDetails } = await buildPRChain(targetBranch, baseBranch);
    
    // Filter out the base branch since it doesn't have a PR
    const prBranches = branches.filter(branch => branch !== baseBranch);
    
    if (prBranches.length === 0) {
        console.log(chalk.yellow('No PRs found in chain'));
        return;
    }

    console.log(chalk.green(`\n# PR Chain: ${baseBranch} → ${targetBranch}\n`));
    
    // Reverse to show from base to target
    const reversedPRBranches = [...prBranches].reverse();
    
    reversedPRBranches.forEach((branch, index) => {
        const pr = prDetails.get(branch);
        if (pr) {
            const position = index + 1;
            const total = reversedPRBranches.length;
            console.log(`- [${position}/${total}] #${pr.number}: [${pr.title}](${pr.url})`);
        }
    });
}

async function propagateChanges(baseBranch: string, targetBranch: string, options: { dryRun?: boolean; numberTitles?: boolean } = {}): Promise<void> {
    const { dryRun = false, numberTitles = false } = options;
    console.log(chalk.blue(`🔍 Building PR chain from ${chalk.cyan(baseBranch)} to ${chalk.cyan(targetBranch)}...`));

    const { branches, prUrls, prDetails } = await buildPRChain(targetBranch, baseBranch);
    
    // Update PR titles with numbers if requested
    if (numberTitles) {
        await updatePRTitlesWithNumbers(prDetails, branches, baseBranch, dryRun);
    }

    console.log(chalk.green(`\n📋 Branch chain discovered:`));
    console.log(
        chalk.yellow(
            `   ${branches
                .slice()
                .reverse()
                .map((branch) => chalk.cyan(branch))
                .join(chalk.gray(' ← '))}`
        )
    );
    console.log(chalk.gray(`   (${branches.length} branches total)\n`));

    if (dryRun) {
        console.log(chalk.yellow(`🔍 DRY RUN MODE: Showing what would be executed without making changes\n`));
    }

    // Merge changes in reverse order (from base to target)
    const reversedChain = [...branches].reverse();

    for (let i = 0; i < reversedChain.length - 1; i++) {
        const sourceBranch = reversedChain[i];
        const targetBranch = reversedChain[i + 1];

        if (!sourceBranch || !targetBranch) {
            continue;
        }

        console.log(
            chalk.blue(
                `\n🔄 [${i + 1}/${reversedChain.length - 1}] Merging ${chalk.cyan(sourceBranch)} into ${chalk.cyan(targetBranch)}...`
            )
        );

        // Display PR URL for the target branch being merged into
        const targetUrl = prUrls.get(targetBranch);
        if (targetUrl) {
            console.log(chalk.yellow(`🔗 PR: ${chalk.underline(targetUrl)}`));
        }

        // Switch to source branch and pull latest
        await executeGitCommand(`git switch ${sourceBranch}`, dryRun);
        await executeGitCommand(`git pull`, dryRun);

        // Switch to target branch and pull latest
        await executeGitCommand(`git switch ${targetBranch}`, dryRun);
        await executeGitCommand(`git pull`, dryRun);

        // Merge source into target
        await executeGitCommand(`git merge --no-ff ${sourceBranch}`, dryRun);
        await executeGitCommand(`git push`, dryRun);
    }

    if (dryRun) {
        console.log(
            chalk.green(`\n✅ Dry run complete! Above commands would propagate changes to ${chalk.cyan(targetBranch)}.`)
        );
    } else {
        console.log(chalk.green(`\n✅ Propagation complete! ${chalk.cyan(targetBranch)} is now up to date.`));
    }
}

async function main(): Promise<void> {
    const program = new Command();

    program
        .name('gh-propagate')
        .description('Propagate changes through a chain of pull requests')
        .version('0.0.15')
        .argument('<base-branch>', 'The base branch to start propagation from')
        .argument('<target-branch>', 'The target branch to propagate changes to')
        .option('-d, --dry-run', 'Show what would be executed without making changes', false)
        .option('-l, --list', 'List all PRs in the chain as markdown links', false)
        .option('-n, --number-titles', 'Add sequential numbering to PR titles', false)
        .action(async (baseBranch: string, targetBranch: string, options: PropagateOptions) => {
            try {
                if (options.list) {
                    await listPRChain(baseBranch, targetBranch);
                } else {
                    await propagateChanges(baseBranch, targetBranch, {
                        dryRun: options.dryRun,
                        numberTitles: options.numberTitles
                    });
                }
            } catch (error) {
                console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
                process.exit(1);
            }
        });

    await program.parseAsync(process.argv);
}

main().catch(console.error);
