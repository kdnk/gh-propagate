/**
 * Get branches from integration branch to target branch (excluding integration branch itself)
 * @param branches Array of branch names in the PR chain
 * @param integrationBranch The integration branch name
 * @returns Array of branch names from integration branch onwards (excluding integration branch itself)
 */
export function getBranchesFromIntegrationToTarget(branches: string[], integrationBranch: string): string[] {
    const integrationIndex = branches.indexOf(integrationBranch);

    if (integrationIndex === -1) {
        // Integration branch not found in chain, return all branches except base
        return branches.filter((branch) => branch !== branches[0]);
    }

    // Return branches from integration branch onwards (excluding integration branch itself)
    return branches.slice(integrationIndex + 1);
}
