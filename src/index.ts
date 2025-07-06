#!/usr/bin/env bun

import chalk from 'chalk';
import { Command } from 'commander';
import type { PropagateOptions } from './types/index.js';
import { listPRChain } from './commands/list.js';
import { propagateChanges } from './commands/propagate.js';

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
        .option('-t, --number-titles', 'Add sequential numbering to PR titles', false)
        .action(async (baseBranch: string, targetBranch: string, options: PropagateOptions) => {
            try {
                if (options.list) {
                    await listPRChain(baseBranch, targetBranch);
                } else {
                    await propagateChanges(baseBranch, targetBranch, {
                        dryRun: options.dryRun,
                        numberTitles: options.numberTitles,
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
