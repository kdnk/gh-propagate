import chalk from 'chalk';

let debugEnabled = false;

export function enableDebugLogging(): void {
    debugEnabled = true;
}

export function logDebug(message: string): void {
    if (debugEnabled) {
        console.log(chalk.gray(`🐛 [DEBUG] ${message}`));
    }
}

export function logChainDiscovery(branches: string[]): void {
    console.log(chalk.green(`\n✅ Branch chain discovered:`));
    console.log(
        chalk.yellow(
            `   ${branches
                .slice()
                .reverse()
                .map((branch) => chalk.cyan(branch))
                .join(chalk.gray(' ← '))}`
        )
    );
    console.log(chalk.gray(`   (${branches.length} branches total)`));
}

export function logMergeStep(index: number, total: number, sourceBranch: string, targetBranch: string): void {
    console.log(
        chalk.blue(
            `\n🔄 [${index + 1}/${total}] Merging ${chalk.cyan(sourceBranch)} into ${chalk.cyan(targetBranch)}...`
        )
    );
}

export function logPRUrl(url: string): void {
    console.log(chalk.yellow(`🔗 PR: ${chalk.underline(url)}`));
}

export function logCompletionMessage(targetBranch: string, isDryRun: boolean): void {
    if (isDryRun) {
        console.log(
            chalk.green(`\n✅ Dry run complete! Above commands would propagate changes to ${chalk.cyan(targetBranch)}.`)
        );
    } else {
        console.log(chalk.green(`\n✅ Propagation complete! ${chalk.cyan(targetBranch)} is now up to date.`));
    }
}

export function logCommand(command: string): void {
    if (debugEnabled) {
        console.log(chalk.gray(`🔧 [CMD] ${command}`));
    }
}

export function logAPICall(endpoint: string, method: string = 'GET'): void {
    if (debugEnabled) {
        console.log(chalk.gray(`🌐 [API] ${method} ${endpoint}`));
    }
}

export function formatErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

export function logDryRun(action: string, details: string): void {
    console.log(chalk.yellow(`[DRY RUN] ${action}: ${details}`));
}
