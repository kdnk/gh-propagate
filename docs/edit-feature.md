# PR Edit Feature Specification

## Overview

Add an option to automatically edit PR attributes with various modifications. Currently supports title numbering, with potential for future expansions such as label management, description updates, and other PR metadata modifications.

## Feature Details

### Option Name

- `--edit` or `-e`
- Boolean flag (no argument required)

### Behavior

When the `--edit` flag is provided:

1. **Discovery Phase**: Build the PR chain as usual from base branch to target branch
2. **Edit Operations**: Apply configured edit operations to PRs in the chain

## Current Features

### Title Numbering

Automatically prefix PR titles with sequential numbers in the format `[n/total]` where `n` is the position in the PR chain and `total` is the total number of PRs in the chain.

**Logic**:
- Number PRs sequentially starting from 1
- Base PR (closest to main) gets `[1/total]`
- Target PR (furthest from main) gets `[total/total]`
- Use `gh pr edit` to update each PR's title with the prefix

#### Title Numbering Examples

##### Basic Example

Given a PR chain:

- PR #123: "Add authentication system" (base: main, head: feature/auth)
- PR #124: "Add user management" (base: feature/auth, head: feature/user-mgmt)
- PR #125: "Add admin dashboard" (base: feature/user-mgmt, head: feature/admin)

After running `gh-propagate main feature/admin --edit`:

- PR #123: "[1/3] Add authentication system"
- PR #124: "[2/3] Add user management"
- PR #125: "[3/3] Add admin dashboard"

##### Handling Existing Brackets

Given a PR chain with existing brackets:

- PR #126: "[feature] Add authentication system"
- PR #127: "[bugfix] Fix user validation"
- PR #128: "Add admin dashboard"

After running `gh-propagate main feature/admin --edit`:

- PR #126: "[1/3][feature] Add authentication system"
- PR #127: "[2/3][bugfix] Fix user validation"
- PR #128: "[3/3] Add admin dashboard"

##### Updating Existing Numbering

Given a PR chain with existing numbering:

- PR #129: "[1/2] Add authentication system"
- PR #130: "[2/2] Add user management"
- PR #131: "Add admin dashboard"

After running `gh-propagate main feature/admin --edit`:

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
gh-propagate main feature/admin --edit

# With dry run
gh-propagate main feature/admin --edit --dry-run

# Short form
gh-propagate main feature/admin -e
```

### Output

When PR editing is enabled, display:

```
🔢 Updating PR titles with sequential numbering...
✓ PR #123: "[1/3] Add authentication system"
✓ PR #124: "[2/3] Add user management"
✓ PR #125: "[3/3] Add admin dashboard"

✅ Updated 3/3 PR titles successfully
```

## Technical Implementation

1. **PR Chain Discovery**: Use existing logic to build PR chain
2. **Edit Operations**: Apply configured edit operations to each PR in the chain

### Title Numbering Implementation

- Use `gh pr edit <number> --title "<new-title>"` for each PR
- Process PRs in order (base to target)
- Format: `[${index + 1}/${total}] ${originalTitle}`
- Remove existing prefix if present before adding new one

## Future Extensibility

The `--edit` flag is designed to be extensible for future PR editing features:

### Potential Future Features

1. **Label Management**:
   - Add consistent labels to PR chain (e.g., `stack:1`, `stack:2`, `stack:3`)
   - Remove specific labels from all PRs in chain
   - Apply priority labels based on position

2. **Description Updates**:
   - Add chain information to PR descriptions
   - Link to related PRs in the chain
   - Add dependency information

3. **Milestone Assignment**:
   - Assign all PRs in chain to the same milestone
   - Update milestone based on chain position

4. **Reviewer Assignment**:
   - Assign consistent reviewers across the chain
   - Auto-assign based on chain position or file changes

### Implementation Strategy

The current implementation focuses on title numbering but is structured to easily accommodate additional edit operations by:

1. Extending the edit options interface
2. Adding new edit operation functions
3. Updating the CLI to support sub-options or configuration files
4. Maintaining backward compatibility with existing usage
