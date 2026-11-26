#!/bin/bash
# SessionStart hook: the stale-branch guard (CLAUDE.md, "Stay on current main").
#
# Runs scripts/branch-check.sh when a Claude Code session starts, resumes,
# clears or compacts, and prints its verdict. Whatever this hook prints is
# added to the agent's context, so every session begins knowing whether its
# branch is up to date with main, behind it, or stale, before it writes a line.
#
# It never blocks or fails the session: any problem (no git, no network, no
# script on this branch yet) prints a short note and exits 0. It installs
# nothing and changes nothing; the agent acts on what it reports.
set -u

cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null || exit 0
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0

if [ ! -f scripts/branch-check.sh ]; then
  echo "Stale-branch guard: scripts/branch-check.sh is not on this branch, so it predates the guard. Compare it with origin/main yourself before committing (CLAUDE.md, \"Stay on current main\")."
  exit 0
fi

# fetch + compare; capped so a slow network never holds the session for long
out=$(timeout 90 bash scripts/branch-check.sh 2>&1)
code=$?
branch=$(git branch --show-current 2>/dev/null)
ahead=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo 0)

case "$code" in
  0)
    echo "Stale-branch guard: ${branch:-HEAD} is up to date with origin/main."
    ;;
  2)
    echo "Stale-branch guard: ${branch:-HEAD} is BEHIND origin/main (no overlapping files)."
    echo "Before your first commit, merge main in: git merge origin/main (rebase only if this branch was never pushed)."
    echo
    printf '%s\n' "$out"
    ;;
  1)
    echo "Stale-branch guard: STOP. ${branch:-HEAD} is STALE against origin/main."
    echo "Do not commit, push or open a PR on this branch until you have read main's changes and told the user what you found."
    echo
    printf '%s\n' "$out"
    ;;
  124)
    echo "Stale-branch guard: the check timed out (slow network?). Run bash scripts/branch-check.sh yourself before your first commit."
    exit 0
    ;;
  *)
    echo "Stale-branch guard: the check could not run (exit $code). Run bash scripts/branch-check.sh yourself before your first commit."
    printf '%s\n' "$out" | tail -3
    exit 0
    ;;
esac

# An existing branch with its own commits may belong to a PR that was merged
# or closed; git alone can't tell, so remind the agent to look it up.
if [ "${ahead:-0}" -gt 0 ] && [ "$branch" != "main" ]; then
  echo "This branch already has ${ahead} commit(s) of its own: look up its pull request with the GitHub tools before continuing. If that PR was merged or closed, start a new branch from origin/main instead (CLAUDE.md, \"Stay on current main\", step 2)."
fi
exit 0
