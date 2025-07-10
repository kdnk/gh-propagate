## Development Notes

- When working with shell commands, prefer using `import { $ } from 'bun'` instead of `import { execSync } from 'child_process'`
- Avoid using TypeScript non-null assertion operator (`!`) - use proper type guards instead
- Use `bun` instead of `npm` for package management and script execution
- Run `bun run format` to format code, `bun run format:check` to check formatting
- Use `say` command to notify me when you are done for each session

## gh-propagate Implementation Notes

### Core Architecture

- Uses `gh pr view --json number,headRefName,baseRefName,url,title,body,state <branch>` to discover PR chains
- Builds PR chain by traversing from target branch back to base branch
- Merges changes in reverse order (base → target) to propagate changes sequentially
- Each merge step: `git switch`, `git pull`, then `git merge --no-ff`
- Command line interface: `gp <target-branch>` with optional `--integration <branch>` for advanced operations

### Command Interface Design

- Single target-branch argument for simplicity: `gp target-branch`
- Optional `--integration <branch>` flag only when needed for list/edit operations
- Simple propagation finds base branch by traversing PR chain automatically
- Integration operations require explicit `--integration` flag for safety
- Validation: `--list` and `--edit` operations require `--integration` to be specified

### PR State Management

- Always use actual PR state from GitHub API (`pr.state === 'MERGED'` not inferred)
- GitHub API returns uppercase states: `'OPEN'`, `'MERGED'`, `'CLOSED'`
- Include `state` field in all `gh pr` JSON queries for accuracy
- Status determination: `pr.state === 'MERGED' ? 'merged' : 'open'`

### Integration vs Simple Mode

- **Simple Mode**: `gp target-branch` - traverses chain to find base, no integration features
- **Integration Mode**: `gp target-branch --integration integration-branch` - includes merged PRs and advanced features
- Integration mode only activates when `--integration` flag is explicitly provided
- Merged PR inclusion and edit operations only available in integration mode

### Edit Operations

- `--edit title`: Adds sequential numbering to PR titles in format `[n/total]`
- `--edit desc`: Updates integration PR description with "## PRs" section and displays content on console
- Title numbering handles existing brackets: `[feature] Title` → `[1/3][feature] Title`
- Title numbering replaces existing numbers: `[1/2] Title` → `[1/3] Title`
- Integration branch itself is excluded from title numbering and total count

### PR Description Management

- Integration operation creates/updates "## PRs" section in integration PR
- Format: `- [position/total] statusIcon #number` (simplified, no links)
- Status icons: ✅ for merged PRs, 🔄 for open PRs
- Completely removes existing "## PRs" sections before adding new one
- Uses line-by-line processing for reliable section replacement
- Console output shows PR list content when using `--edit desc`

### Chain Discovery and Validation

- For simple propagation: traverse from target-branch until no PR found (that's the base)
- For integration operations: validate integration branch PR exists before proceeding
- Include all PRs in chain for desc operations, not just those targeting integration directly
- Merged PRs fetched with `getMergedPRs(integrationBranch)` for accurate integration data

### Iterative Development Lessons

- **Start simple, add complexity gradually**: Begin with basic propagation, then add integration features
- **Explicit is better than implicit**: Use `--integration` flag rather than auto-detection
- **Validate early**: Check required conditions before expensive operations
- **Use actual API data**: Don't infer state when GitHub API provides it directly
- **Naming matters**: `target-branch` is clearer than `feature-branch` for end-of-chain concept
- **Flexible command structure**: Optional flags allow both simple and advanced use cases

### Code Quality Patterns

- Extract shared utilities to avoid code duplication (e.g., `pr-sorting.ts`)
- Use constants for magic strings and status icons (`constants/index.ts`)
- Break large functions into smaller, focused functions
- Use options objects for functions with many parameters
- Always use absolute file paths, never relative paths
- Prefer explicit type checking over type assertions (`pr.state === 'MERGED'` vs `pr.state!`)
- Use TodoWrite tool for complex multi-step implementations to track progress

### Automated Git Workflow

- Always commit and push changes automatically when implementation tasks are completed
- Use descriptive commit messages that explain the "why" and include implementation details
- Follow consistent commit message format with emoji indicators and co-authorship
- Batch related changes into logical commits rather than frequent small commits
- Include HEREDOC syntax for multi-line commit messages to ensure proper formatting
- Always run `git status`, `git diff`, and `git log` in parallel before committing to understand current state
- Add all changes with `git add .` before committing to ensure nothing is missed
- Push immediately after successful commit to keep remote repository synchronized

#### Commit Message Structure

```bash
git commit -m "$(cat <<'EOF'
<type>: <concise description>

- Detailed change 1
- Detailed change 2
- Detailed change 3

<Additional context or impact>

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

#### Types and Examples

- `feat:` - New features or major functionality additions
- `fix:` - Bug fixes and corrections
- `refactor:` - Code restructuring without behavior changes
- `docs:` - Documentation updates and improvements
- `chore:` - Maintenance tasks and tooling updates
