import chalk from 'chalk';
import { buildPRChain } from '../services/pr-chain.js';

export async function listPRChain(baseBranch: string, targetBranch: string): Promise<void> {
    console.log(chalk.blue(`🔍 Building PR chain from ${chalk.cyan(baseBranch)} to ${chalk.cyan(targetBranch)}...`));

    const { branches, prDetails } = await buildPRChain(targetBranch, baseBranch);
    
    const prBranches = branches.filter(branch => branch !== baseBranch);
    
    if (prBranches.length === 0) {
        console.log(chalk.yellow('No PRs found in chain'));
        return;
    }

    console.log(chalk.green(`\n# PR Chain: ${baseBranch} → ${targetBranch}\n`));
    
    const reversedPRBranches = [...prBranches].reverse();
    
    reversedPRBranches.forEach((branch, index) => {
        const pr = prDetails.get(branch);
        if (pr) {
            const position = index + 1;
            const total = reversedPRBranches.length;
            console.log(`- [${position}/${total}] #${pr.number}: [${pr.title}](${pr.url})`);
        }
    });
}