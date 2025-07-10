#!/usr/bin/env bun

import chalk from 'chalk';
import { Command } from 'commander';
import type { PropagateOptions } from './types/index.js';
import { propagateChanges } from './commands/propagate.js';
import { VERSION } from './constants/index.js';
import { formatErrorMessage } from './utils/console.js';

async function main(): Promise<void> {
    const program = new Command();

    program
        .name('gh-propagate')
        .description('Propagate changes through a chain of pull requests')
        .version(VERSION)
        .argument('<target-branch>', 'The target branch to propagate changes to')
        .option('-d, --dry-run', 'Show what would be executed without making changes', false)
        .option('-e, --edit <operations...>', 'Edit PR attributes. Available: title, desc', [])
        .option('-i, --integration <branch>', 'Specify integration branch for edit operations')
        .option('--debug', 'Enable debug logging', false)
        .action(async (targetBranch: string, options: PropagateOptions) => {
            try {
                if (options.debug) {
                    console.log(chalk.yellow('🐛 Debug mode enabled'));
                }

                await propagateChanges(targetBranch, {
                    dryRun: options.dryRun,
                    edit: options.edit,
                    integration: options.integration,
                    debug: options.debug,
                });
            } catch (error) {
                console.error(chalk.red('❌ Error:'), formatErrorMessage(error));
                process.exit(1);
            }
        });

    await program.parseAsync(process.argv);
}

main().catch(console.error);
