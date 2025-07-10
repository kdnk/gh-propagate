#!/usr/bin/env bun

import chalk from 'chalk';
import { Command } from 'commander';
import type { PropagateOptions } from './types/index.js';
import { listPRChain } from './commands/list.js';
import { propagateChanges } from './commands/propagate.js';
import { VERSION } from './constants/index.js';

async function main(): Promise<void> {
    const program = new Command();

    program
        .name('gh-propagate')
        .description('Propagate changes through a chain of pull requests')
        .version(VERSION)
        .argument('<target-branch>', 'The target branch to propagate changes to')
        .option('-d, --dry-run', 'Show what would be executed without making changes', false)
        .option('-l, --list', 'List all PRs in the chain or integration branch', false)
        .option('-e, --edit <operations...>', 'Edit PR attributes. Available: title, desc', [])
        .option('-i, --integration <branch>', 'Specify integration branch for list/edit operations')
        .option('--debug', 'Enable debug logging', false)
        .action(async (targetBranch: string, options: PropagateOptions) => {
            try {
                if (options.debug) {
                    console.log('Debug mode enabled');
                }

                if (options.list) {
                    if (!options.integration) {
                        console.error(chalk.red('❌ --integration option is required when using --list'));
                        process.exit(1);
                    }
                    await listPRChain(options.integration, targetBranch, { debug: options.debug });
                } else {
                    await propagateChanges(targetBranch, {
                        dryRun: options.dryRun,
                        edit: options.edit,
                        integration: options.integration,
                        debug: options.debug,
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
