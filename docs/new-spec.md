# gh-propagate Updated Specification

## Implementation Status: ✅ COMPLETED

All features listed below have been successfully implemented and tested.

## Core Features

### Auto Base Branch Detection ✅
- `gp target-branch` automatically detects the base branch by traversing the PR chain
- Stops when reaching common base branches: `main`, `master`, `dev`, `develop`, `beta`, `development`, `staging`
- Stops when reaching a branch without an associated PR
- Propagates changes from detected base to target branch

### Dry Run Mode ✅
- `gp target-branch --dry-run` shows what will be executed without making changes
- Displays complete execution plan including git commands

### Integration Mode ✅
- **Full Chain Propagation**: Integration mode now propagates the complete PR chain from base to target
- Includes already merged PRs limited to those directly merged into the integration branch
- Fails if integration branch doesn't have a corresponding PR

### Edit Operations ✅
- `gp target-branch --integration integration-branch --edit desc` updates integration PR description with PR chain list
- `gp target-branch --integration integration-branch --edit title` adds sequential numbering `[n/total]` to PR titles (excluding integration branch)
- Multiple operations can be combined: `--edit title desc`
- Fails if integration branch doesn't have a corresponding PR

### Debug Mode ✅
- `gp target-branch --debug` enables detailed logging for troubleshooting
- Shows API calls, git commands, and internal state changes

## Key Improvements

### Consistent Propagation Behavior
Previously, integration mode only propagated to the integration branch's base. Now it propagates the full chain from the detected base branch to the target branch, ensuring complete synchronization.

### Smart Error Handling
- Clear error messages for branches without PRs
- Validation of integration branch requirements
- Graceful handling of various edge cases

### Performance Optimizations
- Reduced duplicate GitHub API calls
- Efficient PR chain traversal
- Minimal redundant git operations
