# Codex Project Memory

Start every new session in this repo with these files, in order:

1. [`.codex/project-memory.md`](.codex/project-memory.md)
2. [`.codex/development-history.md`](.codex/development-history.md)

If this repo is cloned onto a new machine:

- This project assumes repo-local Git hooks live in `.githooks/`.
- Git does not store `core.hooksPath` in the repo itself, so after clone the local repo should run:
  - `git config core.hooksPath .githooks`
- The displayed app version is overridden by `src/generated-app-version.js`.
- That file is generated and ignored by Git, so it may need to be regenerated on a fresh clone before the version label matches the current branch/commit workflow.

Durable operating rules:

- Browser-only UX is the priority and permanent direction.
- Keep the app novice-friendly and local-first. Avoid workflows that require terminal use from end users.
- Diagram data uses YAML only. Do not reintroduce TOML or JSON compatibility unless explicitly requested.
- State and transition schema should stay consistent:
  - states use `id`, `notation`, `notes`
  - transitions and measurements are identified by `between: [...]`
- Avoid backward-compatibility shims unless explicitly requested. This project is still young enough to keep the schema clean.
- App versioning is Git-driven:
  - `main`: `YYYYMMDD.d`
  - other branches: `YYYYMMDD.<branchname>.<commit hash>`
  - runtime override file: [`src/generated-app-version.js`](src/generated-app-version.js)
- Git workflow is GitHub Flow: branch from `main`, keep branches short-lived, merge back to `main`.
- When a durable project decision changes, update both memory files above.
