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
        .argument('<integration-branch>', 'The integration branch that merges into base branch')
        .argument('<target-branch>', 'The target branch to propagate changes to')
        .option('-d, --dry-run', 'Show what would be executed without making changes', false)
        .option('-l, --list', 'List all PRs that merge into integration-branch', false)
        .option('-e, --edit <operations...>', 'Edit PR attributes. Available: title, desc', [])
        .option('--debug', 'Enable debug logging', false)
        .action(async (integrationBranch: string, targetBranch: string, options: PropagateOptions) => {
            try {
                if (options.debug) {
                    console.log('Debug mode enabled');
                }

                if (options.list) {
                    await listPRChain(integrationBranch, targetBranch, { debug: options.debug });
                } else {
                    await propagateChanges(integrationBranch, targetBranch, {
                        dryRun: options.dryRun,
                        edit: options.edit,
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
