import chalk from 'chalk';

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
