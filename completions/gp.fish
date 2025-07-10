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

    # Target branch argument (first positional argument)
    complete -c gp -n "__fish_gp_no_target_branch" -a "(__fish_gp_branches)" -d "Target branch"
end

# Helper function: check if target branch is not yet provided
function __fish_gp_no_target_branch
    set -l cmd (commandline -opc)
    
    # Skip the command name
    for i in (seq 2 (count $cmd))
        set -l arg $cmd[$i]
        
        # If this is not an option (doesn't start with -)
        if not string match -q -- '-*' $arg
            # Check if the previous argument was an option that takes a value
            if test $i -gt 2
                set -l prev_arg $cmd[(math $i - 1)]
                # If previous was -i, --integration, -e, or --edit, this is the option value
                if test "$prev_arg" = "-i"; or test "$prev_arg" = "--integration"; or test "$prev_arg" = "-e"; or test "$prev_arg" = "--edit"
                    continue
                end
            end
            # Found a target branch
            return 1
        end
    end
    
    # No target branch found
    return 0
end

# Helper function: get git branches
function __fish_gp_branches
    # Only show branches if we're in a git repository
    if git rev-parse --git-dir >/dev/null 2>&1
        # Get local and remote branches, clean up formatting
        git branch --all 2>/dev/null | string replace -r '^\s*[\*\s]*' '' | string replace -r '^remotes/origin/' '' | grep -v '^HEAD ->' | sort -u
    end
end