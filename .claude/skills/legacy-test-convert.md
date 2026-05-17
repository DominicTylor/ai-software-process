---
name: legacy-test-convert
description: Convert pre-canon tests (raw selectors, sleep-based timing, internal-state peeking) into commented-test shape, extracting selectors into framework PageObjects.
model: sonnet
allowed-tools: Read, Write, Edit, Glob, Grep, Agent
---

# /legacy-test-convert

Migrates existing tests into the canon's commented-test format. Each step in the source test becomes a `// # <step>` comment plus an `await user.X()` call into a framework verb. Selectors that were hardcoded in test bodies migrate into framework PageObjects with stable names. Sleep-based timing is replaced with event-driven waits where possible; remaining sleeps are flagged for follow-up.

Without this skill, brownfield catch-up bottlenecks on the cost of manually rewriting thousands of tests. With it, conversion happens incrementally — typically tied to touch-trigger or coverage-audit priorities.

## Reads

- The legacy test file being converted (Playwright, Jest, or similar; the assumption is that the file exists and runs against the current system)
- `frameworks/` — to discover existing user-action vocabulary so conversion reuses verbs where they fit
- The corresponding Story (if any) — to align scenario names and goal coverage
- `process.md` § Commented tests, § Frameworks — for canonical shape

## Produces

- Converted test file: each step expressed as `// # <natural-language>` comment followed by `await user.X()`; the test passes the same assertions as before
- Extended framework PageObjects (or analogous helpers): new verbs introduced by the conversion, with explicit selectors carried over
- A change summary listing every new verb added to the shared vocabulary (for Quality Gate Specialist review) and every sleep that could not be replaced with an event-driven wait
- A flagged-conversions list: tests that could not be cleanly converted (internal-state peeking that is the actual assertion, mocks that test framework internals, etc.) — those require Owner or QC decision rather than mechanical conversion

## Invokes

- `quality-spec` — for vocabulary decisions, scenario-shape verification, framework boundary discipline
- Code-perimeter specialists when conversion requires identifying the right `data-testid` to attach to UI elements that didn't carry one before

## Mode

Invokable in a branch. Not run automatically — conversion is an intentional act.

## Implementation notes

When refining the prompt, ensure it:

- Never silently drops a test assertion during conversion. If a test was checking X, the converted test still checks X — either through a framework verb or as a flagged exception.
- Distinguishes "this sleep is masking a race condition" from "this sleep is a legitimate wait for a real time-based behavior" — only the former is replaced.
- Treats internal-state peeking as a smell to surface, not a transformation to perform. Some peeks are legitimate (security probes); most are not. Owner / QC decides per case.
- Records the test-id contract changes so code-perimeter can be notified what new `data-testid` attributes they need to attach to existing UI.
