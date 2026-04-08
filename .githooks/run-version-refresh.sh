#!/bin/sh

repo_root="$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0
cd "$repo_root" || exit 0

branch_name="${CI_COMMIT_REF_NAME:-$(git branch --show-current 2>/dev/null)}"
[ -n "$branch_name" ] || branch_name="detached"

head_date="$(git show -s --format=%cd --date=format-local:%Y%m%d HEAD 2>/dev/null)"
[ -n "$head_date" ] || exit 0

if [ "$branch_name" = "main" ]; then
  daily_index="$(git log --first-parent --format=%cd --date=format-local:%Y%m%d HEAD 2>/dev/null | grep -c "^$head_date$")"
  [ -n "$daily_index" ] || daily_index="1"
  version_string="$head_date.$daily_index"
else
  short_hash="$(git rev-parse --short HEAD 2>/dev/null)"
  [ -n "$short_hash" ] || exit 0
  safe_branch_name="$(printf '%s' "$branch_name" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//')"
  [ -n "$safe_branch_name" ] || safe_branch_name="detached"
  version_string="$head_date.$safe_branch_name.$short_hash"
fi

printf 'window.__APP_RUNTIME_VERSION_OVERRIDE__ = "%s";\n' "$version_string" > src/generated-app-version.js
