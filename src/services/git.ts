import { $ } from 'bun';
import chalk from 'chalk';

export async function executeGitCommand(command: string, dryRun: boolean = false): Promise<void> {
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
