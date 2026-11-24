#!/usr/bin/env bash
# branch-check.sh — is this branch still based on current main?
#
# Run at the start of every session and again before every push or PR
# (CLAUDE.md, "Stay on current main"). CI runs it on every pull request
# (.github/workflows/branch-freshness.yml).
#
#   scripts/branch-check.sh [ref] [base]      defaults: HEAD origin/main
#
# Exit codes:
#   0  up to date: the branch contains everything on main
#   2  behind, no overlap: main moved on, but not in files this branch
#      touches. Merge origin/main in before continuing (the "daily pull").
#   1  STALE: since this branch split off, main changed files this branch
#      also changes, or main already holds this branch's files at another
#      path (the work was squash-merged or moved). Stop and read main first.
set -u
REF="${1:-HEAD}"
BASE="${2:-origin/main}"

git fetch --quiet origin "${BASE#origin/}" 2>/dev/null || echo "warning: could not fetch ${BASE}; comparing with the local copy"

if ! git rev-parse --verify --quiet "$BASE" >/dev/null; then echo "error: no ${BASE}"; exit 1; fi
SPLIT=$(git merge-base "$REF" "$BASE" 2>/dev/null)
# cloud sessions clone shallow: deepen until the split point is in history
if [ -z "$SPLIT" ] && [ "$(git rev-parse --is-shallow-repository)" = "true" ]; then
  git fetch --quiet --unshallow origin 2>/dev/null || git fetch --quiet --deepen=1000 origin 2>/dev/null
  SPLIT=$(git merge-base "$REF" "$BASE" 2>/dev/null)
fi
if [ -z "$SPLIT" ]; then echo "error: ${REF} and ${BASE} share no history (try: git fetch --unshallow origin)"; exit 1; fi
BEHIND=$(git rev-list --count "$REF..$BASE")
AHEAD=$(git rev-list --count "$BASE..$REF")
NAME=$(git rev-parse --abbrev-ref "$REF" 2>/dev/null || echo "$REF")
SPLIT_DATE=$(git log -1 --format=%cs "$SPLIT")

echo "Branch ${NAME}: ${AHEAD} commit(s) ahead of ${BASE}, ${BEHIND} behind; split off at $(git log -1 --format='%h %s' "$SPLIT") (${SPLIT_DATE})."
if [ "$BEHIND" -eq 0 ]; then echo "OK: up to date with ${BASE}."; exit 0; fi

# files this branch changes (committed, plus uncommitted/untracked work when checking HEAD)
branch_files() {
  git diff --name-only "$SPLIT" "$REF"
  if [ "$REF" = "HEAD" ]; then git diff --name-only HEAD; git ls-files --others --exclude-standard; fi
}
BRANCH_FILES=$(branch_files | sort -u)
MAIN_FILES=$(git diff --name-only "$SPLIT" "$BASE" | sort -u)
MAIN_GONE=$(git diff --name-status --diff-filter=DR "$SPLIT" "$BASE" | awk '{print $2}' | sort -u)
# this branch's added/changed files whose exact content main already has at a
# DIFFERENT path: the work was merged (squash) and then moved or reorganised
MOVED=$(awk -F'\t' 'NR==FNR { main[$1] = $2; next } ($1 in main) && main[$1] != $2 && $1 !~ /^e69de29/ { print "  " $2 "  ->  now " main[$1] }' \
  <(git ls-tree -r "$BASE" | sed -n 's/^[0-9]* blob //p') \
  <(git diff --raw --no-abbrev --no-renames --diff-filter=AM "$SPLIT" "$REF" | awk -F'\t' '{ split($1, f, " "); print f[4] "\t" $2 }'))
OVERLAP=$(comm -12 <(printf '%s\n' "$MAIN_FILES") <(printf '%s\n' "$BRANCH_FILES") | sed '/^$/d')
GONE=$(comm -12 <(printf '%s\n' "$MAIN_GONE") <(printf '%s\n' "$BRANCH_FILES") | sed '/^$/d')

echo
echo "Merged into ${BASE} since then:"
git log --format='  %h %cs %s' "$SPLIT..$BASE" | head -15
[ "$BEHIND" -gt 15 ] && echo "  … and $((BEHIND - 15)) more"

if [ -z "$OVERLAP" ] && [ -z "$MOVED" ]; then
  echo
  echo "BEHIND: none of those commits touch files this branch changes."
  echo "Merge them in before more work:  git merge origin/main   (rebase only if the branch was never pushed)"
  exit 2
fi

echo
if [ -n "$OVERLAP" ]; then
  echo "STALE: since this branch split off, ${BASE} changed $(printf '%s\n' "$OVERLAP" | wc -l | tr -d ' ') file(s) this branch also changes:"
  printf '  %s\n' $OVERLAP
fi
if [ -n "$MOVED" ]; then
  echo "STALE: ${BASE} already has $(printf '%s\n' "$MOVED" | wc -l | tr -d ' ') of this branch's files, same content, at a new path (merged, then moved):"
  printf '%s\n' "$MOVED" | head -10
  [ "$(printf '%s\n' "$MOVED" | wc -l)" -gt 10 ] && echo "  …"
fi
if [ -n "$GONE" ]; then
  echo "…and DELETED or MOVED these, which this branch still edits (strong sign the work was superseded):"
  printf '  %s\n' $GONE
fi
cat <<MSG

Stop before committing, pushing or opening a PR:
  1. Read what main did:  git diff ${SPLIT:0:7} ${BASE} -- <files above>
  2. Check this branch's pull request on GitHub. If it was merged or closed,
     do not commit here again: start a new branch from ${BASE} and port the
     changes onto what main has now (see CLAUDE.md, "Stay on current main").
  3. Otherwise merge ${BASE} in and resolve, then run this check again.
Tell the user what you found before going on.
MSG
exit 1
