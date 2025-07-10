# Usage Examples

This document provides practical examples of using gh-propagate with the new auto base branch detection and enhanced integration mode features.

## Simple Mode Examples

### Basic Propagation

```bash
# Automatically detect base branch and propagate to feature-step-2
gp feature-step-2
```

**What happens:**

1. Discovers PR chain: `main ← feature-step-1 ← feature-step-2`
2. Stops at `main` (common base branch)
3. Propagates: `main` → `feature-step-1` → `feature-step-2`

### Preview Changes

```bash
# See what will be executed without making changes
gp feature-step-2 --dry-run
```

**Output example:**

```
🔍 Building PR chain from main to feature-step-2...
✅ Branch chain discovered:
   main ← feature-step-1 ← feature-step-2
   (3 branches total)

🔄 [1/2] Merging main into feature-step-1...
⏳ [DRY RUN] git switch main
⏳ [DRY RUN] git pull
⏳ [DRY RUN] git switch feature-step-1
⏳ [DRY RUN] git pull
⏳ [DRY RUN] git merge --no-ff main
⏳ [DRY RUN] git push
```

### Debug Mode

```bash
# Enable detailed logging for troubleshooting
gp feature-step-2 --debug
```

**Additional output includes:**

- GitHub API calls
- Internal state changes
- PR discovery process
- Git command execution details

## Integration Mode Examples

### Update PR Titles

```bash
# Add sequential numbering to PR titles
gp feature-step-2 --integration integration-branch --edit title
```

**Before:**

- "Feature Step 1"
- "Feature Step 2"

**After:**

- "[1/2] Feature Step 1"
- "[2/2] Feature Step 2"

### Update Integration PR Description

```bash
# Add PR list to integration PR description
gp feature-step-2 --integration integration-branch --edit desc
```

**Adds to integration PR:**

```markdown
## PRs

- [1/2] 🔄 #123
- [2/2] 🔄 #124
```

### Combined Operations

```bash
# Update both titles and description
gp feature-step-2 --integration integration-branch --edit title desc
```

## Complex Scenarios

### Long PR Chain

Given chain: `main ← step1 ← step2 ← step3 ← step4`

```bash
# Propagate entire chain automatically
gp step4
```

**Result:** All intermediate steps (step1, step2, step3) get updated with changes from main.

### Custom Base Branch

Given chain: `develop ← feature-a ← feature-b`

```bash
# Automatically detects 'develop' as base branch
gp feature-b
```

### Integration with Different Base

```bash
# Integration operations with full chain propagation
gp feature-final --integration integration-feature --edit title desc
```

**Behavior:**

1. Validates integration-feature has a PR
2. Discovers full chain from base to feature-final
3. Propagates entire chain
4. Applies edit operations to PRs in chain

## Error Scenarios

### No PR for Target Branch

```bash
gp main
```

**Output:**

```
❌ No pull request found for branch: main. This might be the base branch already, or the branch doesn't have a PR.
```

### Invalid Integration Branch

```bash
gp feature-step-2 --integration nonexistent-branch --edit title
```

**Output:**

```
❌ Integration branch PR not found. Make sure the integration branch has a corresponding PR.
```

### Missing Integration Flag

```bash
gp feature-step-2 --edit title
```

**Output:**

```
❌ --integration option is required when using --edit
```

## Best Practices

### 1. Use Dry Run First

Always preview changes for complex chains:

```bash
gp target-branch --dry-run
```

### 2. Debug When Needed

Enable debug mode for troubleshooting:

```bash
gp target-branch --debug
```

### 3. Integration Operations

Use integration mode for PR management:

```bash
# Full workflow for integration features
gp target-branch --integration integration-branch --edit title desc --dry-run
# Review the plan, then execute without --dry-run
gp target-branch --integration integration-branch --edit title desc
```

## Common Base Branches

The tool automatically recognizes these base branch names:

- `main`
- `master`
- `dev`
- `develop`
- `development`
- `beta`
- `staging`

If your base branch has a different name, the tool will still work by following PR relationships until it finds a branch without an associated PR.
