[![npm version](https://badge.fury.io/js/gh-propagate.svg)](https://badge.fury.io/js/gh-propagate)

# gh-propagate

A command-line tool for propagating changes through a chain of pull requests with automatic integration branch detection and PR management features.

![CleanShot 2025-07-04 at 10 18 46](https://github.com/user-attachments/assets/14080c23-fad9-424a-a24b-f0ea32192b94)

## Overview

`gh-propagate` automatically merges changes through sequential pull requests while providing powerful PR management features. It automatically detects integration branches, supports PR title numbering, and can update integration PR descriptions with chain information. This is particularly useful when working with stacked pull requests where changes need to be propagated from base branches to target branches.

![image](https://github.com/user-attachments/assets/1a595aaf-cdd7-4019-9141-6b41c7d1046d)

## How It Works

The tool discovers the chain of pull requests by traversing from your target branch back to the base branch using GitHub CLI (`gh`), then merges changes in reverse order to ensure proper propagation. Integration branches are automatically detected and merged PRs are included in all operations.

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
gh-propagate [options] <base-branch> <target-branch>
```

Examples:

```bash
gh-propagate main feature-branch
gh-propagate --dry-run main feature-branch
gh-propagate --list main feature-branch
gh-propagate --edit title main feature-branch
gh-propagate --edit title,integration main feature-branch
```

### Options

- `--dry-run`, `-d`: Preview what commands would be executed without making any changes
- `--list`, `-l`: List all PRs in the chain as markdown links with status icons
- `--edit <operations>`, `-e <operations>`: Apply edit operations to PRs. Available operations:
    - `title`: Add sequential numbering to PR titles in `[n/total]` format
    - `integration`: Update integration PR description with PR list
- `--version`, `-v`: Show version information

## Features

### Core Functionality

1. **PR Chain Discovery**: Automatically discovers the chain of pull requests using `gh pr view --json number,headRefName,baseRefName,url,title,body --head <branch>`
2. **Sequential Merging**: Merges changes in reverse order (base → target) with proper git operations:
    - `git switch <source-branch>`
    - `git pull`
    - `git switch <target-branch>`
    - `git pull`
    - `git merge --no-ff <source-branch>`
    - `git push`
3. **Integration Branch Detection**: Automatically detects integration branches (PRs that merge directly into base branch) and includes merged PRs in all operations

### Edit Operations

- **Title Numbering**: Automatically prefix PR titles with sequential numbers `[n/total]`
- **Integration PR Updates**: Update integration PR descriptions with formatted PR lists including status icons
- **Smart Bracket Handling**: Preserves existing brackets in titles when adding numbering

### Additional Features

- **Dry Run Mode**: Preview all operations without making changes
- **Status Icons**: Visual indicators for open (🔄) and merged (✅) PRs
- **Comprehensive Listing**: List all PRs in chain with proper numbering and status

## Examples

### Basic Usage

```bash
# Simple propagation
gh-propagate main feature-branch

# Preview changes without executing
gh-propagate --dry-run main feature-branch

# List PRs in the chain
gh-propagate --list main feature-branch
```

### Edit Operations

```bash
# Add sequential numbering to PR titles
gh-propagate --edit title main feature-branch

# Update integration PR description with PR list
gh-propagate --edit integration main feature-branch

# Apply both operations
gh-propagate --edit title,integration main feature-branch

# Use with dry run to preview changes
gh-propagate --edit title --dry-run main feature-branch
```

### Output Examples

**List output:**

```
- [1/3] ✅ #123: [Add authentication system](https://github.com/user/repo/pull/123)
- [2/3] 🔄 #124: [Add user management](https://github.com/user/repo/pull/124)
- [3/3] 🔄 #125: [Add admin dashboard](https://github.com/user/repo/pull/125)
```

**Title numbering output:**

```
🔄 Updating PR titles with sequential numbering...
✅ PR #123: "[1/3] Add authentication system"
✅ PR #124: "[2/3] Add user management"
✅ PR #125: "[3/3] Add admin dashboard"
✅ Updated 3/3 PR titles successfully
```

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
