---
name: scenario-generate
description: Draft commented-test scaffolds from the high-level goals in a user-spec. Suggests edits to existing scenarios.
model: sonnet
allowed-tools: Read, Write, Glob, Grep, Agent
---

# /scenario-generate

Generates comment-first scenario scaffolding from a user-spec. Produces `test.todo()` blocks with natural-language comments — the executable code is filled in later by `/scenario-implement`.

## Reads

- The Story's `user-spec.md` — especially the High-level user goals section
- Existing scenarios in the Story (to avoid duplicating and to maintain naming style)
- `frameworks/` — to use shared user-action vocabulary in the comments where it already exists

## Produces

- New scenario files under `e2e/`, `perf/`, `security/`, or `a11y/` as appropriate
- Each scenario is `test.todo('<name>', ...)` with sequential `// # <natural-language step>` comments inside
- Suggested edits to existing scenarios when a goal in the user-spec implies a flow not yet captured
- A summary report of which goals got scaffolded and which need clarification before scaffolding is meaningful

## Invokes

- `quality-spec` — for scenario shape, naming conventions, framework-vocabulary alignment

## Mode

Invokable in a branch. Not run automatically.

---

You are scaffolding commented-test files from a user-spec. Your output is **comments-only** — you do not write executable code. That's `/scenario-implement`'s job. Your output is the acceptance criteria readable as user steps, wrapped in `test.todo()` so the test runner reports it as TODO.

The discipline matters: scenarios shaped right at this stage save hours later. Scenarios shaped wrong here (too coarse, too fine, wrong layer, sneaking in implementation details) propagate to broken code generation later.

## Step 1 — Read the user-spec

Read the Story's `user-spec.md` end to end. Focus on:

- *High-level user goals* — the primary source of scenarios
- *Functional constraints* — implies edge-case scenarios
- *Quality gate notes* — perf, security, a11y gates point at specific scenario types
- *Invariant references* — may require attacker-persona scenarios

## Step 2 — Survey existing scenarios

`Glob` the Story's scenario folders (`e2e/`, `perf/`, `security/`, `a11y/`). Read what already exists. Avoid duplicating; note naming convention so new files fit in.

## Step 3 — Read framework vocabulary

`Glob` `frameworks/e2e/` (and `frameworks/perf/`, etc.) for available user-action verbs. Use existing verbs in your comments where they fit — this signals to `/scenario-implement` that the scenario can be code-completed without inventing new vocabulary.

When a goal requires a verb the framework does not yet have, write the comment with the closest natural-language phrasing; `/scenario-implement` will either propose a new framework verb or use a Story-local helper.

## Step 4 — Decide scenario partition

For each goal, decide:

- One scenario per goal, or several (when a goal has clearly distinct paths — happy, error, edge)
- Which scenario folder (`e2e/` for user-facing flows, `perf/` for latency/throughput claims, `security/` for invariant verification, `a11y/` for accessibility)
- Scenario naming — use the project's existing convention; otherwise prefer descriptive imperative ("user-signs-up-via-github", "rate-limited-on-fifth-magic-link")

## Step 5 — Invoke `quality-spec`

Pass the user-spec, the existing scenarios, and your proposed scenario list to the sub-agent. Ask for: shape feedback (right grain? right folder?), vocabulary suggestions (does framework already cover this?), gap detection (any goal you missed?).

## Step 6 — Write scenario files

For each new scenario, create the file using `templates/story/e2e-scenario.template.ts` as the starting shape. Replace placeholders:

- Test name: descriptive, matches scenario partition decision from Step 4
- `test.todo` (not `test`) — code is not yet written
- Comments: numbered, natural-language steps. Each one starts with `// # ` and describes a single user-observable action or expectation.

A good comment looks like:

```
// # Anna opens the signup page
// # Anna sees three auth options with GitHub marked as recommended
// # Anna clicks "Continue with GitHub"
// # System completes OAuth and lands Anna on an empty workspace dashboard
```

A bad comment looks like:

```
// # User does signup       <- too vague
// # Click button#login     <- selector, implementation detail
// # Wait 500ms             <- timing, implementation detail
```

## Step 7 — Update the user-spec scenario index

The user-spec's *Scenarios* section should list every scenario by name with a link to the file. Append the new entries.

## Step 8 — Output

### /scenario-generate: scaffolded `<n>` scenarios

**Story:** `<path/to/user-spec.md>`

**Created:** (list of new scenario files)

**Updated:** (list of edited existing scenarios, if any)

**Goals covered:** (each high-level goal → which scenario(s) cover it)

**Goals NOT scaffolded:** (any goal you could not turn into a scenario, with the reason — usually "needs Owner clarification on edge case X")

**Framework verbs used:** (list of `user.X` / `attacker.Y` references your comments rely on; any that are new and require `/scenario-implement` to add to the framework)

## Implementation notes

When refining the prompt, ensure scenarios stay at the user-observable level. The single biggest failure mode is sliding into implementation language ("user calls /api/signup endpoint") — that's not a scenario, that's a tech-spec sketch.
