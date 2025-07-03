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

async function executeGitCommand(command: string): Promise<void> {
  console.log(chalk.gray(`Executing: ${command}`));
  await $`${{ raw: command }}`;
}

async function propagateChanges(baseBranch: string, targetBranch: string): Promise<void> {
  console.log(chalk.blue(`🔍 Building PR chain from ${chalk.cyan(baseBranch)} to ${chalk.cyan(targetBranch)}...`));

  const chain = await buildPRChain(targetBranch, baseBranch);
  console.log(chalk.green(`📋 PR chain: ${chain.map(branch => chalk.yellow(branch)).join(chalk.gray(' ← '))}`));

  // Merge changes in reverse order (from base to target)
  const reversedChain = [...chain].reverse();

  for (let i = 0; i < reversedChain.length - 1; i++) {
    const sourceBranch = reversedChain[i];
    const targetBranch = reversedChain[i + 1];

    console.log(chalk.blue(`\n🔄 Merging ${chalk.cyan(sourceBranch)} into ${chalk.cyan(targetBranch)}...`));

    // Switch to source branch and pull latest
    await executeGitCommand(`git switch ${sourceBranch}`);
    await executeGitCommand(`git pull`);

    // Switch to target branch and pull latest
    await executeGitCommand(`git switch ${targetBranch}`);
    await executeGitCommand(`git pull`);

    // Merge source into target
    await executeGitCommand(`git merge --no-ff ${sourceBranch}`);
    await executeGitCommand(`git push`);
  }

  console.log(chalk.green(`\n✅ Propagation complete! ${chalk.cyan(targetBranch)} is now up to date.`));
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length !== 2) {
    console.error(chalk.red('❌ Usage: gh-propagate <base-branch> <target-branch>'));
    console.error(chalk.yellow('💡 Example: gh-propagate dev feature-2'));
    process.exit(1);
  }

  const [baseBranch, targetBranch] = args;

  if (!baseBranch || !targetBranch) {
    console.error(chalk.red('❌ Both base-branch and target-branch are required'));
    process.exit(1);
  }

  try {
    await propagateChanges(baseBranch, targetBranch);
  } catch (error) {
    console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main().catch(console.error);
