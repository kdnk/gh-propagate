[![npm version](https://badge.fury.io/js/gh-propagate.svg)](https://badge.fury.io/js/gh-propagate)

# gh-propagate

![CleanShot 2025-07-04 at 10 18 46](https://github.com/user-attachments/assets/14080c23-fad9-424a-a24b-f0ea32192b94)

## Prerequisites

- GitHub CLI (`gh`) installed and authenticated https://cli.github.com/

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

