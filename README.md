[![npm version](https://badge.fury.io/js/gh-propagate.svg)](https://badge.fury.io/js/gh-propagate)

# gh-propagate

A command-line tool for propagating changes through a chain of pull requests.

![CleanShot 2025-07-04 at 10 18 46](https://github.com/user-attachments/assets/14080c23-fad9-424a-a24b-f0ea32192b94)

## Overview

`gh-propagate` automatically merges changes through sequential pull requests, maintaining the proper order of dependencies. This is particularly useful when working with stacked pull requests where changes need to be propagated from base branches to target branches.

## How It Works

The tool discovers the chain of pull requests by traversing from your target branch back to the base branch using GitHub CLI (`gh`), then merges changes in reverse order to ensure proper propagation.

**Example scenario:**
- Base branch: `dev`
- Pull request chain: `dev ← feature-1 ← feature-2`

When you run `gh-propagate dev feature-2`, the tool will:
1. Discover the PR chain: `dev → feature-1 → feature-2`
2. Merge changes in order: `dev` → `feature-1` → `feature-2`
3. Each merge step includes switching branches, pulling latest changes, and merging with `--no-ff`

## Prerequisites

- [GitHub CLI (`gh`)](https://cli.github.com/) must be installed and authenticated
- Git repository with pull requests created via GitHub

## Installation

### Using npm/bun (Global)
```bash
# Using bun
bun install -g gh-propagate

# Using npm
npm install -g gh-propagate
```

### Using Fisher (Fish shell completions)
```bash
# Install Fish shell completions only
fisher install kdnk/gh-propagate
```

This adds Fish shell completions with tab completion for branch names. You still need to install the `gh-propagate` tool separately using npm or bun.

## Usage

```bash
gp [--dry-run|-d] <base-branch> <target-branch>
```

Examples:
```bash
gp main feature-branch
gp --dry-run main feature-branch
gp -d main feature-branch
```

### Options

- `--dry-run`, `-d`: Preview what commands would be executed without making any changes

## What It Does

1. **Discovers the PR chain** using `gh pr view --json number,headRefName,baseRefName --head <branch>`
2. **Builds the chain** by traversing from target branch back to base branch
3. **Merges changes sequentially** in reverse order (base → target):
   - `git switch <source-branch>`
   - `git pull`
   - `git switch <target-branch>`
   - `git pull`
   - `git merge --no-ff <source-branch>`
   - `git push`

## Development

```bash
# Build the project
bun run build

# Run tests
bun test

# Version bump
bun run version
```

## License

Apache License 2.0

