# Fish completion for gp (gh-propagate)

# Only add completions if gp command exists
if type -q gp
    # Remove any default file completion
    complete -c gp -f

    # Main options
    complete -c gp -s d -l dry-run -d "Show what would be executed without making changes"
    complete -c gp -s e -l edit -x -a "title desc" -d "Edit PR attributes"
    complete -c gp -s i -l integration -x -a "(__fish_gp_branches)" -d "Specify integration branch"
    complete -c gp -l debug -d "Enable debug logging"
    complete -c gp -s V -l version -d "Output the version number"
    complete -c gp -s h -l help -d "Display help for command"

    # Target branch argument (always available)
    complete -c gp -a "(__fish_gp_branches)" -d "Target branch"
end


# Helper function: get git branches
function __fish_gp_branches
    # Only show branches if we're in a git repository
    if git rev-parse --git-dir >/dev/null 2>&1
        # Get local and remote branches, clean up formatting
        git branch --all 2>/dev/null | string replace -r '^\s*[\*\s]*' '' | string replace -r '^remotes/origin/' '' | grep -v '^HEAD ->' | sort -u
    end
end