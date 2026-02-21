import { $ } from 'bun';
import chalk from 'chalk';
import { logCommand, logDebug, logDryRun } from '../utils/console.js';

export async function executeGitCommand(command: string, dryRun: boolean = false): Promise<void> {
    logCommand(command);

    if (dryRun) {
        logDryRun('Would execute', command);
    } else {
        console.log(chalk.white(`⏳ Executing: ${command}`));
        const result = await $`${{ raw: command }}`.quiet();
        const stderr = result.stderr.toString().trim();
        const stdout = result.stdout.toString().trim();

        if (stderr) {
            console.log(chalk.gray(stderr));
            logDebug(`Command stderr: ${stderr}`);
        }
        if (stdout) {
            console.log(chalk.gray(stdout));
            logDebug(`Command stdout: ${stdout}`);
        }

        logDebug(`Command completed with exit code: ${result.exitCode}`);
    }
}

async function getWorktreePath(branch: string): Promise<string | null> {
    const result = await $`git worktree list --porcelain`.quiet();
    const output = result.stdout.toString().trim();

    const blocks = output.split('\n\n');
    for (const block of blocks) {
        const lines = block.split('\n');
        let worktreePath: string | undefined;
        let branchRef: string | undefined;

        for (const line of lines) {
            if (line.startsWith('worktree ')) {
                worktreePath = line.slice('worktree '.length);
            } else if (line.startsWith('branch ')) {
                branchRef = line.slice('branch '.length);
            }
        }

        if (worktreePath && branchRef === `refs/heads/${branch}`) {
            return worktreePath;
        }
    }

    return null;
}

export async function executeMergeOperation(
    sourceBranch: string,
    targetBranch: string,
    dryRun: boolean = false
): Promise<void> {
    const sourceWorktreePath = await getWorktreePath(sourceBranch);
    const targetWorktreePath = await getWorktreePath(targetBranch);

    // Update source branch
    if (sourceWorktreePath) {
        await executeGitCommand(`git -C "${sourceWorktreePath}" pull`, dryRun);
    } else {
        await executeGitCommand(`git switch ${sourceBranch}`, dryRun);
        await executeGitCommand(`git pull`, dryRun);
    }

    // Update target branch, merge, and push
    if (targetWorktreePath) {
        await executeGitCommand(`git -C "${targetWorktreePath}" pull`, dryRun);
        await executeGitCommand(`git -C "${targetWorktreePath}" merge --no-ff ${sourceBranch}`, dryRun);
        await executeGitCommand(`git -C "${targetWorktreePath}" push`, dryRun);
    } else {
        await executeGitCommand(`git switch ${targetBranch}`, dryRun);
        await executeGitCommand(`git pull`, dryRun);
        await executeGitCommand(`git merge --no-ff ${sourceBranch}`, dryRun);
        await executeGitCommand(`git push`, dryRun);
    }
}
