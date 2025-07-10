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

export async function executeMergeOperation(
    sourceBranch: string,
    targetBranch: string,
    dryRun: boolean = false
): Promise<void> {
    await executeGitCommand(`git switch ${sourceBranch}`, dryRun);
    await executeGitCommand(`git pull`, dryRun);
    await executeGitCommand(`git switch ${targetBranch}`, dryRun);
    await executeGitCommand(`git pull`, dryRun);
    await executeGitCommand(`git merge --no-ff ${sourceBranch}`, dryRun);
    await executeGitCommand(`git push`, dryRun);
}
