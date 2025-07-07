## Development Notes

- When working with shell commands, prefer using `import { $ } from 'bun'` instead of `import { execSync } from 'child_process'`
- Avoid using TypeScript non-null assertion operator (`!`) - use proper type guards instead
- Use `bun` instead of `npm` for package management and script execution
- Run `bun run format` to format code, `bun run format:check` to check formatting

## gh-propagate Implementation Notes

- Uses `gh pr view --json number,headRefName,baseRefName --head <branch>` to discover PR chains
- Builds PR chain by traversing from target branch back to base branch
- Merges changes in reverse order (base → target) to propagate changes sequentially
- Each merge step: `git switch`, `git pull`, then `git merge --no-ff`
- Command line interface: `gh-propagate <base-branch> <target-branch>`
