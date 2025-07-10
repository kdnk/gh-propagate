# Fish completion for gp (gh-propagate)

# Only add completions if gp command exists
if type -q gp
    complete -c gp -f

    # Options
    complete -c gp -s d -l dry-run -d "Show what would be executed without making changes"
    complete -c gp -s e -l edit -x -a "title desc" -d "Edit PR attributes. Available: title, desc"
    complete -c gp -s i -l integration -x -a "(__fish_gp_branches)" -d "Specify integration branch for edit operations"
    complete -c gp -l debug -d "Enable debug logging"
    complete -c gp -s V -l version -d "Output the version number"
    complete -c gp -s h -l help -d "Display help for command"

    # Branch completion for target-branch argument
    complete -c gp -n "__fish_gp_needs_target_branch" -a "(__fish_gp_branches)"
end

# Helper functions
function __fish_gp_needs_target_branch
    set -l cmd (commandline -opc)
    set -l has_target_branch 0
    set -l skip_next 0
    
    # Check if we already have a target branch (non-option argument)
    for i in (seq 2 (count $cmd))
        if test $skip_next -eq 1
            set skip_next 0
            continue
        end
        
        set -l arg $cmd[$i]
        
        # Skip if this is an option
        if string match -q -- '-*' $arg
            # Check if this option takes a value
            if string match -q -- '*integration*' $arg; or string match -q -- '*edit*' $arg; or test "$arg" = "-i"; or test "$arg" = "-e"
                set skip_next 1
            end
            continue
        end
        
        # This is a non-option argument, so it's the target branch
        set has_target_branch 1
        break
    end
    
    test $has_target_branch -eq 0
end

function __fish_gp_branches
    # Only show branches if we're in a git repository
    if git rev-parse --git-dir >/dev/null 2>&1
        git branch --all 2>/dev/null | sed 's/^[\* ] *//' | sed 's/^remotes\/origin\///' | grep -v '^HEAD ->' | sort -u
    end
end
