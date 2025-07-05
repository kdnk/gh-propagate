# Fish completion for gp (gh-propagate)

# Only add completions if gp command exists
if type -q gp
    complete -c gp -f

    # Options
    complete -c gp -s d -l dry-run -d "Show what would be executed without making changes"
    complete -c gp -s V -l version -d "Output the version number"
    complete -c gp -s h -l help -d "Display help for command"

    # Branch completion for first argument (base-branch)
    complete -c gp -n "__fish_gp_is_first_arg" -a "(__fish_gp_branches)"

    # Branch completion for second argument (target-branch)
    complete -c gp -n "__fish_gp_is_second_arg" -a "(__fish_gp_branches_exclude_first)"
end

# Helper functions
function __fish_gp_is_first_arg
    set -l cmd (commandline -opc)
    test (count $cmd) -eq 1
end

function __fish_gp_is_second_arg
    set -l cmd (commandline -opc)
    test (count $cmd) -eq 2
end

function __fish_gp_branches
    # Only show branches if we're in a git repository
    if git rev-parse --git-dir >/dev/null 2>&1
        git branch --all 2>/dev/null | sed 's/^[\* ] *//' | sed 's/^remotes\/origin\///' | grep -v '^HEAD ->' | sort -u
    end
end

function __fish_gp_branches_exclude_first
    # Only show branches if we're in a git repository
    if git rev-parse --git-dir >/dev/null 2>&1
        set -l cmd (commandline -opc)
        if test (count $cmd) -ge 2
            set -l first_branch $cmd[2]
            git branch --all 2>/dev/null | sed 's/^[\* ] *//' | sed 's/^remotes\/origin\///' | grep -v '^HEAD ->' | grep -v "^$first_branch\$" | sort -u
        else
            git branch --all 2>/dev/null | sed 's/^[\* ] *//' | sed 's/^remotes\/origin\///' | grep -v '^HEAD ->' | sort -u
        end
    end
end
