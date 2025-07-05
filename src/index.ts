#!/usr/bin/env bun

import { $ } from 'bun';
import chalk from 'chalk';
import { Command } from 'commander';

interface PullRequest {
    number: number;
    headRefName: string;
    baseRefName: string;
    url: string;
}

interface PropagateOptions {
    dryRun?: boolean;
}

async function getPullRequest(branch: string): Promise<PullRequest | null> {
    try {
        const result = await $`gh pr view --json number,headRefName,baseRefName,url ${branch}`.text();
        return JSON.parse(result);
    } catch (error) {
        return null;
    }
}

interface ChainInfo {
    branches: string[];
    prUrls: Map<string, string>;
}

async function buildPRChain(startBranch: string, baseBranch: string): Promise<ChainInfo> {
    const branches: string[] = [];
    const prUrls = new Map<string, string>();
    let currentBranch = startBranch;

    while (currentBranch !== baseBranch) {
        const pr = await getPullRequest(currentBranch);
        if (!pr) {
            throw new Error(`No pull request found for branch: ${currentBranch}`);
        }

        branches.push(currentBranch);
        prUrls.set(currentBranch, pr.url);
        currentBranch = pr.baseRefName;
    }

    branches.push(baseBranch);
    return { branches, prUrls };
}

async function executeGitCommand(command: string, dryRun: boolean = false): Promise<void> {
    if (dryRun) {
        console.log(chalk.yellow(`[DRY RUN] Would execute: ${command}`));
    } else {
        console.log(chalk.white(`⏳ Executing: ${command}`));
        const result = await $`${{ raw: command }}`.quiet();
        if (result.stdout) {
            console.log(chalk.gray(result.stdout.toString().trim()));
        }
    }
}

async function propagateChanges(baseBranch: string, targetBranch: string, dryRun: boolean = false): Promise<void> {
    console.log(chalk.blue(`🔍 Building PR chain from ${chalk.cyan(baseBranch)} to ${chalk.cyan(targetBranch)}...`));

    const { branches, prUrls } = await buildPRChain(targetBranch, baseBranch);

    console.log(chalk.green(`\n📋 Branch chain discovered:`));
    console.log(chalk.yellow(`   ${branches.slice().reverse().map(branch => chalk.cyan(branch)).join(chalk.gray(' ← '))}`));
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

        console.log(chalk.blue(`\n🔄 [${i + 1}/${reversedChain.length - 1}] Merging ${chalk.cyan(sourceBranch)} into ${chalk.cyan(targetBranch)}...`));

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
        console.log(chalk.green(`\n✅ Dry run complete! Above commands would propagate changes to ${chalk.cyan(targetBranch)}.`));
    } else {
        console.log(chalk.green(`\n✅ Propagation complete! ${chalk.cyan(targetBranch)} is now up to date.`));
    }
}

async function main(): Promise<void> {
    const program = new Command();

    program
        .name('gh-propagate')
        .description('Propagate changes through a chain of pull requests')
        .version('0.0.9')
        .argument('<base-branch>', 'The base branch to start propagation from')
        .argument('<target-branch>', 'The target branch to propagate changes to')
        .option('-d, --dry-run', 'Show what would be executed without making changes', false)
        .action(async (baseBranch: string, targetBranch: string, options: PropagateOptions) => {
            try {
                await propagateChanges(baseBranch, targetBranch, options.dryRun);
            } catch (error) {
                console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
                process.exit(1);
            }
        });

    await program.parseAsync(process.argv);
}

main().catch(console.error);
