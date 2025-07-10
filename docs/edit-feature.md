# PR Edit Feature Specification

## Overview

Add an option to automatically edit PR attributes with various modifications. Currently supports title numbering, with potential for future expansions such as label management, description updates, and other PR metadata modifications.

## Feature Details

### Option Name

- `--edit <operations...>` or `-e <operations...>`
- Accepts one or more edit operation names as arguments
- Available operations: `title`, `integration`

### Behavior

When the `--edit` flag is provided with operations:

1. **Discovery Phase**: Build the PR chain as usual from base branch to target branch
2. **Validation**: Validate that all specified operations are supported
3. **Edit Operations**: Apply each specified edit operation to PRs in the chain

## Current Features

### Title Numbering (`title` operation)

Automatically prefix PR titles with sequential numbers in the format `[n/total]` where `n` is the position in the PR chain and `total` is the total number of PRs in the chain.

### Integration PR Description (`integration` operation)

Updates the integration PR (the first PR in the chain that merges into the base branch) with a "## PRs" section containing a simplified list of only the PRs that are directly merged into the integration branch, with status icons but no links.

**Logic for Integration Operation**:

- Find the integration PR (first PR in chain merging to base branch)
- Filter PRs to include only those directly merged into the integration branch (not the entire chain)
- Generate a simplified list of filtered PRs with their numbered positions and status icons
- Add or update a "## PRs" section in the integration PR description
- If "## PRs" section already exists, replace it completely with the new content
- Include status icons (🔄 for open, ✅ for merged PRs)
- Format: `- [position/total] statusIcon #number` (no links in description)

**Logic for Title Operation**:

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

After running `gh-propagate main feature/admin --edit title`:

- PR #123: "[1/3] Add authentication system"
- PR #124: "[2/3] Add user management"
- PR #125: "[3/3] Add admin dashboard"

##### Handling Existing Brackets

Given a PR chain with existing brackets:

- PR #126: "[feature] Add authentication system"
- PR #127: "[bugfix] Fix user validation"
- PR #128: "Add admin dashboard"

After running `gh-propagate main feature/admin --edit title`:

- PR #126: "[1/3][feature] Add authentication system"
- PR #127: "[2/3][bugfix] Fix user validation"
- PR #128: "[3/3] Add admin dashboard"

##### Updating Existing Numbering

Given a PR chain with existing numbering:

- PR #129: "[1/2] Add authentication system"
- PR #130: "[2/2] Add user management"
- PR #131: "Add admin dashboard"

After running `gh-propagate main feature/admin --edit title`:

- PR #129: "[1/3] Add authentication system"
- PR #130: "[2/3] Add user management"
- PR #131: "[3/3] Add admin dashboard"

### Implementation Details

1. **Title Processing**:
    - Check if title already has a number prefix (regex: `^\[\d+/\d+\]\s*`)
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
# Title numbering only
gh-propagate main feature/admin --edit title

# Multiple operations
gh-propagate main feature/admin --edit title integration

# With dry run
gh-propagate main feature/admin --edit title --dry-run

# Short form
gh-propagate main feature/admin -e title
```

### Output

When PR editing is enabled, display:

**For title operation:**

```
🔄 Updating PR titles with sequential numbering...
✅ PR #123: "[1/3] Add authentication system"
✅ PR #124: "[2/3] Add user management"
✅ PR #125: "[3/3] Add admin dashboard"
✅ Updated 3/3 PR titles successfully
```

**For integration operation:**

```
🔄 Updating integration PR description with PR list...
✅ Updated integration PR #123 description
```

#### Integration Operation Examples

**Adding PR list to empty description:**
If the integration PR has no existing description, a new "## PRs" section is added with only PRs directly merged into the integration branch:

```markdown
## PRs

- [1/2] ✅ #123
- [2/2] 🔄 #124
```

**Updating existing PR list:**
If the integration PR already has a "## PRs" section, it is completely replaced with only the PRs directly merged into the integration branch:

Before:

```markdown
This is the main PR for the feature.

## PRs

- [1/2] ✅ #123
- [2/2] 🔄 #124

## Additional Notes

Some other content.
```

After (assuming #125 is not directly merged into the integration branch):

```markdown
This is the main PR for the feature.

## PRs

- [1/2] ✅ #123
- [2/2] 🔄 #124

## Additional Notes

Some other content.
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
