## Development Notes

- When working with shell commands, prefer using `import { $ } from 'bun'` instead of `import { execSync } from 'child_process'`
- Avoid using TypeScript non-null assertion operator (`!`) - use proper type guards instead
- Use `bun` instead of `npm` for package management and script execution
- Run `bun run format` to format code, `bun run format:check` to check formatting

## gh-propagate Implementation Notes

### Core Architecture

- Uses `gh pr view --json number,headRefName,baseRefName --head <branch>` to discover PR chains
- Builds PR chain by traversing from target branch back to base branch
- Merges changes in reverse order (base → target) to propagate changes sequentially
- Each merge step: `git switch`, `git pull`, then `git merge --no-ff`
- Command line interface: `gh-propagate <base-branch> <target-branch>`

### Integration Branch Detection

- Always runs in integration mode (automatically includes merged PRs)
- Integration PR is automatically detected as the PR that merges directly into base branch
- Uses `pr.baseRefName === baseBranch` to identify integration PR
- No longer requires `-i` flag - integration detection is automatic

### Edit Operations

- `--edit title`: Adds sequential numbering to PR titles in format `[n/total]`
- `--edit integration`: Updates integration PR description with "## PRs" section
- Title numbering handles existing brackets: `[feature] Title` → `[1/3][feature] Title`
- Title numbering replaces existing numbers: `[1/2] Title` → `[1/3] Title`

### PR Description Management

- Integration operation creates/updates "## PRs" section in integration PR
- Format: `- [position/total] statusIcon #number` (simplified, no links)
- Status icons: ✅ for merged PRs, 🔄 for open PRs
- Completely removes existing "## PRs" sections before adding new one
- Uses line-by-line processing for reliable section replacement

### Code Quality Patterns

- Extract shared utilities to avoid code duplication (e.g., `pr-sorting.ts`)
- Use constants for magic strings and status icons (`constants/index.ts`)
- Break large functions into smaller, focused functions
- Use options objects for functions with many parameters
- Always use absolute file paths, never relative paths
