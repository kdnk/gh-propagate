import { MAIN_BRANCHES } from '../constants/index.js';

export function isMainBranch(branchName: string): boolean {
    return MAIN_BRANCHES.includes(branchName as any);
}

export function validateIntegrationBranch(baseBranch: string): boolean {
    return !isMainBranch(baseBranch);
}
