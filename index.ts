#!/usr/bin/env bun

import { $ } from 'bun';
import chalk from 'chalk';

interface PullRequest {
  number: number;
  headRefName: string;
  baseRefName: string;
}

async function getPullRequest(branch: string): Promise<PullRequest | null> {
  try {
    const result = await $`gh pr view --json number,headRefName,baseRefName ${branch}`.text();
    return JSON.parse(result);
  } catch (error) {
    return null;
  }
}

async function buildPRChain(startBranch: string, baseBranch: string): Promise<string[]> {
  const chain: string[] = [];
  let currentBranch = startBranch;

  while (currentBranch !== baseBranch) {
    const pr = await getPullRequest(currentBranch);
    if (!pr) {
      throw new Error(`No pull request found for branch: ${currentBranch}`);
    }

    chain.push(currentBranch);
    currentBranch = pr.baseRefName;
  }

  chain.push(baseBranch);
  return chain;
}

async function executeGitCommand(command: string, dryRun: boolean = false): Promise<void> {
  if (dryRun) {
    console.log(chalk.yellow(`[DRY RUN] Would execute: ${command}`));
  } else {
    console.log(chalk.gray(`Executing: ${command}`));
    await $`${{ raw: command }}`;
  }
}

async function propagateChanges(baseBranch: string, targetBranch: string, dryRun: boolean = false): Promise<void> {
  console.log(chalk.blue(`🔍 Building PR chain from ${chalk.cyan(baseBranch)} to ${chalk.cyan(targetBranch)}...`));

  const chain = await buildPRChain(targetBranch, baseBranch);
  
  console.log(chalk.green(`\n📋 Branch chain discovered:`));
  console.log(chalk.yellow(`   ${chain.slice().reverse().map(branch => chalk.cyan(branch)).join(chalk.gray(' ← '))}`));
  console.log(chalk.gray(`   (${chain.length} branches total)\n`));

  if (dryRun) {
    console.log(chalk.yellow(`🔍 DRY RUN MODE: Showing what would be executed without making changes\n`));
  }

  // Merge changes in reverse order (from base to target)
  const reversedChain = [...chain].reverse();

  for (let i = 0; i < reversedChain.length - 1; i++) {
    const sourceBranch = reversedChain[i];
    const targetBranch = reversedChain[i + 1];

    console.log(chalk.blue(`\n🔄 Merging ${chalk.cyan(sourceBranch)} into ${chalk.cyan(targetBranch)}...`));

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
  const args = process.argv.slice(2);
  
  // Check for dry run flag
  const dryRunIndex = args.findIndex(arg => arg === '--dry-run' || arg === '-d');
  const dryRun = dryRunIndex !== -1;
  
  // Remove dry run flag from args
  if (dryRunIndex !== -1) {
    args.splice(dryRunIndex, 1);
  }

  if (args.length !== 2) {
    console.error(chalk.red('❌ Usage: gh-propagate [--dry-run|-d] <base-branch> <target-branch>'));
    console.error(chalk.yellow('💡 Example: gh-propagate dev feature-2'));
    console.error(chalk.yellow('💡 Example: gh-propagate --dry-run dev feature-2'));
    process.exit(1);
  }

  const [baseBranch, targetBranch] = args;

  if (!baseBranch || !targetBranch) {
    console.error(chalk.red('❌ Both base-branch and target-branch are required'));
    process.exit(1);
  }

  try {
    await propagateChanges(baseBranch, targetBranch, dryRun);
  } catch (error) {
    console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main().catch(console.error);
