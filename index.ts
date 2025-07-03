#!/usr/bin/env node

import { execSync } from 'child_process';

interface PullRequest {
  number: number;
  headRefName: string;
  baseRefName: string;
}

async function getPullRequest(branch: string): Promise<PullRequest | null> {
  try {
    const result = execSync(`gh pr view --json number,headRefName,baseRefName --head ${branch}`, { encoding: 'utf8' });
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

function executeGitCommand(command: string): void {
  console.log(`Executing: ${command}`);
  execSync(command, { stdio: 'inherit' });
}

async function propagateChanges(baseBranch: string, targetBranch: string): Promise<void> {
  console.log(`Building PR chain from ${baseBranch} to ${targetBranch}...`);
  
  const chain = await buildPRChain(targetBranch, baseBranch);
  console.log(`PR chain: ${chain.join(' ← ')}`);
  
  // Merge changes in reverse order (from base to target)
  const reversedChain = [...chain].reverse();
  
  for (let i = 0; i < reversedChain.length - 1; i++) {
    const sourceBranch = reversedChain[i];
    const targetBranch = reversedChain[i + 1];
    
    console.log(`\nMerging ${sourceBranch} into ${targetBranch}...`);
    
    // Switch to source branch and pull latest
    executeGitCommand(`git switch ${sourceBranch}`);
    executeGitCommand(`git pull`);
    
    // Switch to target branch and pull latest
    executeGitCommand(`git switch ${targetBranch}`);
    executeGitCommand(`git pull`);
    
    // Merge source into target
    executeGitCommand(`git merge --no-ff ${sourceBranch}`);
  }
  
  console.log(`\nPropagation complete! ${targetBranch} is now up to date.`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  if (args.length !== 2) {
    console.error('Usage: gh-propagate <base-branch> <target-branch>');
    console.error('Example: gh-propagate dev feature-2');
    process.exit(1);
  }
  
  const [baseBranch, targetBranch] = args;
  
  try {
    await propagateChanges(baseBranch, targetBranch);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);