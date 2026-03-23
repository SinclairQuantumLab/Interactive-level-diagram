# Development Workflow

This project uses GitHub Flow.

- Branch from `main` for every change.
- Keep feature or fix branches focused and short-lived.
- Merge completed work back into `main`.

App versioning:

- On `main`, the app version format is `YYYYMMDD.d`.
- On non-`main` branches, the app version format is `YYYYMMDD.<branchname>.<commit hash>`.
- Repo-local hooks in `.githooks/` refresh `src/generated-app-version.js` after commits, checkouts, merges, and rewrites.
