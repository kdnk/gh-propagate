# Integration Branch Feature Specification

## Overview

The `--integration` option treats the first argument (base-branch) as an integration branch, which affects how PR numbering is calculated when used with `-t` or `--list` options.

## Option Details

- **Option name**: `--integration` / `-i`
- **Type**: Boolean flag
- **Default**: `false`

## Behavior

When the `--integration` option is enabled:

1. **Treats the first argument as an integration branch**: The base-branch parameter is considered an integration branch where PRs are merged sequentially
2. **Includes merged PRs in numbering**: When combined with `-t` (number-titles) or `--list` options, the tool considers PRs that have already been merged into the base-branch for sequential numbering
3. **Maintains proper sequence**: The numbering reflects the intended order of PRs in the integration workflow, including both open and merged PRs

## Usage Examples

```bash
# List PRs with integration numbering
gh-propagate --integration --list integration feature-branch

# Apply sequential numbering considering merged PRs
gh-propagate --integration --number-titles integration feature-branch

# Combined with dry-run
gh-propagate --integration --dry-run --number-titles integration feature-branch
```

## Implementation Notes

- The tool should query both open and merged PRs when `--integration` is used
- Merged PRs should be included in the chain discovery process
- Sequential numbering should account for the chronological order of PRs in the integration branch
