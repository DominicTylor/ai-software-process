---
name: check
description: Run the project's pre-commit checks per AGENTS.md — format, lint, typecheck, docs-in-sync, and the unit / package-local test layer.
model: sonnet
allowed-tools: Bash, Read
---

Run the project's pre-commit check set. Read `AGENTS.md` for the canonical command list; do not guess.

## Prerequisites

If the test layer in `AGENTS.md` requires a runtime dependency (database container, message broker, cache), check it is up first. If not, stop immediately and tell the user which command from `AGENTS.md` brings it up. Do not run any further commands until that prerequisite is satisfied.

## Standard sequence

Run the checks in the order documented in `AGENTS.md`. A typical sequence looks like:

1. format check
2. lint check
3. typecheck
4. generated docs in sync (if the project generates docs from source — e.g., protocol or API references)
5. unit / package-local tests

Stop and report the failure if any command exits with a non-zero code.

## Report

Report results as a checklist with ✅ / ❌ next to each step.

If everything passes: **READY TO COMMIT**.
If anything fails: show the exact error output and what needs to be fixed.

## Adopter notes

Starter example. Wire the actual command names into `AGENTS.md` so this skill reads the live contract instead of carrying stale strings. Broader, slower lanes (full integration, browser end-to-end) usually do not belong in a pre-commit gate — they belong in CI and in `qa-review` work.
