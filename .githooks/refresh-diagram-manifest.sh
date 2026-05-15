#!/bin/sh

repo_root="$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0
cd "$repo_root" || exit 0

manifest_path="diagrams/manifest.json"

tmp_file="$(mktemp 2>/dev/null)" || exit 1

cleanup() {
  rm -f "$tmp_file"
}

trap cleanup EXIT INT TERM

{
  printf '{\n'
  printf '  "files": [\n'

  first=1
  find diagrams -maxdepth 1 -type f \( -name '*.yaml' -o -name '*.yml' \) ! -name 'manifest.json' \
    | sed 's#.*[\\/]##' \
    | LC_ALL=C sort \
    | while IFS= read -r file_name; do
        [ -n "$file_name" ] || continue
        escaped_file_name="$(printf '%s' "$file_name" | sed 's/\\/\\\\/g; s/"/\\"/g')"
        if [ "$first" -eq 1 ]; then
          first=0
        else
          printf ',\n'
        fi
        printf '    "%s"' "$escaped_file_name"
      done

  printf '\n'
  printf '  ]\n'
  printf '}\n'
} > "$tmp_file"

if [ ! -f "$manifest_path" ] || ! cmp -s "$tmp_file" "$manifest_path"; then
  mv "$tmp_file" "$manifest_path"
fi
