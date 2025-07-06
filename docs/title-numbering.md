# PR Title Numbering Feature Specification

## Overview

Add an option to automatically prefix PR titles with sequential numbers in the format `[n/total]` where `n` is the position in the PR chain and `total` is the total number of PRs in the chain.

## Feature Details

### Option Name
- `--number-titles` or `-n`
- Boolean flag (no argument required)

### Behavior
When the `--number-titles` flag is provided:

1. **Discovery Phase**: Build the PR chain as usual from base branch to target branch
2. **Numbering Logic**: 
   - Number PRs sequentially starting from 1
   - Base PR (closest to main) gets `[1/total]`
   - Target PR (furthest from main) gets `[total/total]`
3. **Title Update**: Use `gh pr edit` to update each PR's title with the prefix

### Examples

#### Basic Example
Given a PR chain:
- PR #123: "Add authentication system" (base: main, head: feature/auth)
- PR #124: "Add user management" (base: feature/auth, head: feature/user-mgmt)  
- PR #125: "Add admin dashboard" (base: feature/user-mgmt, head: feature/admin)

After running `gh-propagate main feature/admin --number-titles`:
- PR #123: "[1/3] Add authentication system"
- PR #124: "[2/3] Add user management"
- PR #125: "[3/3] Add admin dashboard"

#### Handling Existing Brackets
Given a PR chain with existing brackets:
- PR #126: "[feature] Add authentication system"
- PR #127: "[bugfix] Fix user validation"
- PR #128: "Add admin dashboard"

After running `gh-propagate main feature/admin --number-titles`:
- PR #126: "[1/3][feature] Add authentication system"
- PR #127: "[2/3][bugfix] Fix user validation"
- PR #128: "[3/3] Add admin dashboard"

#### Updating Existing Numbering
Given a PR chain with existing numbering:
- PR #129: "[1/2] Add authentication system"
- PR #130: "[2/2] Add user management"
- PR #131: "Add admin dashboard"

After running `gh-propagate main feature/admin --number-titles`:
- PR #129: "[1/3] Add authentication system"
- PR #130: "[2/3] Add user management"
- PR #131: "[3/3] Add admin dashboard"

### Implementation Details

1. **Title Processing**:
   - Check if title already has a number prefix (regex: `^\[\d+/\d+\]`)
   - If found, replace with new numbering
   - If title contains other brackets (e.g., `[feature] Add new API`), prepend numbering: `[1/3][feature] Add new API`
   - If not found, prepend the numbering with a space: `[1/3] Add new API`

2. **Error Handling**:
   - If `gh pr edit` fails for any PR, log error but continue with other PRs
   - Display summary of successful/failed title updates

3. **Dry Run Support**:
   - Show what titles would be changed without actually updating them
   - Useful for verification before making changes

### CLI Integration

```bash
# Basic usage
gh-propagate main feature/admin --number-titles

# With dry run
gh-propagate main feature/admin --number-titles --dry-run

# Short form
gh-propagate main feature/admin -n
```

### Output

When title numbering is enabled, display:
```
Updating PR titles with sequential numbering...
✓ PR #123: "[1/3] Add authentication system"
✓ PR #124: "[2/3] Add user management"  
✓ PR #125: "[3/3] Add admin dashboard"
```

## Technical Implementation

1. **PR Chain Discovery**: Use existing logic to build PR chain
2. **Title Updates**: 
   - Use `gh pr edit <number> --title "<new-title>"` for each PR
   - Process PRs in order (base to target)
3. **Prefix Logic**:
   - Format: `[${index + 1}/${total}] ${originalTitle}`
   - Remove existing prefix if present before adding new one