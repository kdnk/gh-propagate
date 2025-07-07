# gh-propagate Basic Implementation

## Overview

gh-propagate is a command-line tool that uses GitHub CLI to propagate changes through sequential pull requests, keeping them up-to-date automatically.

## How It Works

Given a base branch and target branch with sequential PRs like:
- `dev ← feature-1` (PR #123)
- `feature-1 ← feature-2` (PR #124)

Running `gh-propagate dev feature-2` will:

1. **Discovery Phase**: Use `gh pr view --json number,headRefName,baseRefName,url,title,body --head <branch>` to discover the PR chain:
   - Find feature-2's target branch (feature-1)
   - Find feature-1's target branch (dev)
   - Stop when reaching the base branch (dev)

2. **Propagation Phase**: Merge changes in reverse order (base → target):
   - Update dev branch: `git switch dev`, `git pull`
   - Merge into feature-1: `git switch feature-1`, `git pull`, `git merge --no-ff dev`, `git push`
   - Update feature-1: `git switch feature-1`, `git pull`
   - Merge into feature-2: `git switch feature-2`, `git pull`, `git merge --no-ff feature-1`, `git push`

3. **Integration Mode**: Automatically detects and includes merged PRs in all operations

## Command Line Interface

```bash
gh-propagate <base-branch> <target-branch> [options]
```

Available options:
- `--dry-run, -d`: Preview operations without executing
- `--list, -l`: List PR chain with status icons
- `--edit <operations>, -e`: Edit PR attributes (title, integration)
- `--version, -v`: Show version

## Technical Implementation

- Built with TypeScript and Bun runtime
- Uses `import { $ } from 'bun'` for shell commands
- Commander.js for CLI interface
- Automatic integration branch detection
- Status tracking with icons (🔄 for open, ✅ for merged)

This ensures all PRs in the chain stay synchronized with the latest changes from the base branch.
