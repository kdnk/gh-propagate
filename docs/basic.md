# gh-propagate Basic Implementation

## Overview

gh-propagate is a command-line tool that uses GitHub CLI to propagate changes through sequential pull requests, keeping them up-to-date automatically.

## How It Works

### Simple Mode (Auto Base Branch Detection)

Given sequential PRs like:

- `main ← feature-1` (PR #123)
- `feature-1 ← feature-2` (PR #124)

Running `gp feature-2` will:

1. **Auto Discovery Phase**: Automatically traverse the PR chain from target to base:
    - Start from feature-2
    - Find feature-2's base branch (feature-1)
    - Find feature-1's base branch (main)
    - Stop when reaching a common base branch (`main`, `master`, `dev`, `develop`, `beta`, `staging`) or a branch without PR

2. **Propagation Phase**: Merge changes in reverse order (base → target):
    - Update main branch: `git switch main`, `git pull`
    - Merge into feature-1: `git switch feature-1`, `git pull`, `git merge --no-ff main`, `git push`
    - Update feature-1: `git switch feature-1`, `git pull`
    - Merge into feature-2: `git switch feature-2`, `git pull`, `git merge --no-ff feature-1`, `git push`

### Integration Mode

When using `--integration` flag, the tool still propagates the full chain from base to target, but also enables advanced features like merged PR inclusion and edit operations.

## Command Line Interface

```bash
gp <target-branch> [options]
```

Available options:

- `--dry-run, -d`: Preview operations without executing
- `--edit <operations>, -e`: Edit PR attributes - available: `title`, `desc` (requires `--integration`)
- `--integration <branch>, -i`: Specify integration branch for edit operations
- `--debug`: Enable debug logging for troubleshooting
- `--version, -v`: Show version

## Examples

### Simple Usage

```bash
# Propagate changes from base to feature-step-2
gp feature-step-2

# Preview what will be executed
gp feature-step-2 --dry-run

# Enable debug output
gp feature-step-2 --debug
```

### Integration Mode

```bash
# Update PR titles with numbering
gp feature-step-2 --integration integration-branch --edit title

# Update integration PR description
gp feature-step-2 --integration integration-branch --edit desc

# Combine multiple edit operations
gp feature-step-2 --integration integration-branch --edit title desc
```

## Technical Implementation

- Built with TypeScript and Bun runtime
- Uses `import { $ } from 'bun'` for shell commands
- Commander.js for CLI interface
- **Auto base branch detection**: Recognizes common base branches (`main`, `master`, `dev`, `develop`, `beta`, `staging`)
- **Smart PR chain traversal**: Automatically finds the base by following PR relationships
- Status tracking with icons (🔄 for open, ✅ for merged)
- **Full chain propagation**: Always propagates from detected base to target, even in integration mode
- Edit operations for PR titles and descriptions (integration mode only)

## Key Features

### Auto Base Branch Detection

The tool automatically detects the base branch by:

1. Starting from the target branch
2. Following PR base relationships backwards
3. Stopping when reaching:
   - A common base branch name (`main`, `master`, `dev`, `develop`, `beta`, `staging`)
   - A branch without an associated PR

### Consistent Propagation Behavior

Both simple and integration modes now propagate the complete PR chain from the detected base branch to the target branch, ensuring all PRs stay synchronized with the latest changes.
