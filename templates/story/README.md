# Story Template

A Story is a folder, not a document. This template shows the shape.

## Creating a new Story

1. Create a folder under `stories/` in the master repo. The grouping inside `stories/` (by phase, by domain, flat) is a project convention; pick one and stay consistent.
2. Copy `user-spec.template.md` to `<your-story>/user-spec.md` and fill in.
3. Create the scenario subfolders that apply (`e2e/`, `perf/`, `security/`, `a11y/`) — omit those that do not.
4. For each scenario, start from `e2e-scenario.template.ts` and write **comment-only steps** wrapped in `test.todo()`. The executable code is filled in later by `/scenario-implement`.
5. Open a branch, commit, push, open a PR when ready for review.

## What does NOT belong in a Story folder

- Tech specs — those live in the affected code repositories
- Implementation details — same
- Decision history or changelogs — those live in git commit messages
- Future-state behavior or parked ideas — those live in `ideas/` at the repo root

See [`../../process.md`](../../process.md) § Artifact ontology → Story for the full rules.
