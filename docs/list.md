# --list Option Specification

## Overview

The `--list` option displays all PRs in a branch chain as markdown links, making it easy to view and navigate the PR sequence.

## Usage

```bash
gh-propagate --list <base-branch> <target-branch>
```

## Behavior

1. Discovers the PR chain from `<base-branch>` to `<target-branch>` using the existing chain discovery logic
2. Outputs each PR in the chain as a markdown link in the format: `- [n/total] #<number>: [<title>](<url>)`
3. PRs are listed in order from base to target branch
4. If no PR chain is found, displays an appropriate message

## Example Output

```markdown
# PR Chain: main → feature/auth

- [1/3] #123: [Add user authentication](https://github.com/owner/repo/pull/123)
- [2/3] #124: [Implement login form](https://github.com/owner/repo/pull/124)
- [3/3] #125: [Add password reset](https://github.com/owner/repo/pull/125)
```

## Error Handling

- If branch chain cannot be discovered, show error message
- If no PRs found in chain, show "No PRs found in chain" message
- Invalid branch names should show appropriate error

## Implementation Notes

- Reuse existing PR discovery logic from main propagate functionality
- Use `gh pr view --json` to get PR details including title and PR number
- Format output as clean markdown for easy copying/sharing
