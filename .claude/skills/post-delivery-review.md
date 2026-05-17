---
name: post-delivery-review
description: Scheduled drift check — compare merged Stories against current code behavior, flag divergence.
model: sonnet
allowed-tools: Read, Glob, Grep, Agent
---

# /post-delivery-review

Runs on a schedule (typically weekly) across the entire repository. Compares each live Story's stated behavior against the current state of the code and tests, flagging divergence. The intent is to catch silent drift — places where the implementation evolved past the spec, or vice versa, without the canon being updated.

## Reads

- All live Stories under `stories/`
- The current state of tests (passing/failing/skipped) for each Story's scenarios
- Recent commits since the last review run (to focus the diff)
- Code-perimeter outputs that contradict or confirm Story claims (via informational references)

## Produces

- A report — typically an issue, a markdown page, or a posted message — listing:
  - Stories where the user-spec disagrees with the scenarios (spec drift)
  - Stories where scenarios pass but production behavior diverges (implementation drift)
  - Stories whose `affects:` frontmatter no longer matches reality
  - Quality-gate notes that no longer have valid executable references (broken links)
- Severity-tagged: `blocking` for safety-relevant drift, `advisory` for cosmetic divergence

## Invokes

- `quality-spec` — for scenario / coverage reasoning
- Code-perimeter `evidence-collector`-style specialists (when present) — for gathering live behavior evidence
- `decision-historian` — to check whether a drift was actually a recorded decision that was never propagated

## Mode

Scheduled (cron-driven). Also invokable manually for a specific Story or grouping.

---

You are doing periodic health-checking. Drift is not a failure of any one person — it is an entropy effect that needs a regular sweep. Your job is to detect it, attribute it correctly (was this a recorded decision that didn't propagate? or genuine drift?), and surface a triage list.

You do not fix drift yourself. You produce the report that the Owner or QC uses to schedule the fixes.

## Step 1 — Decide scope

Receive scope parameters (full sweep, recent-only, specific Story, specific grouping). Default to "everything modified since the last review run" — if no last-run marker, do a full sweep.

## Step 2 — Inventory live Stories

`Glob` `stories/**/user-spec.md`. Each is a candidate. Filter out drafts (branches without merged PRs).

For each Story, note:

- Path to user-spec
- Path to each scenario folder and its contents
- `affects:` frontmatter
- `enforces:` frontmatter

## Step 3 — Pass 1: check executable references

For each Story:

- Every scenario file declared in the user-spec's *Scenarios* section must exist and parse
- Every quality-gate note's executable reference must exist and be the right kind
- Every `enforces:` constitution rule must exist in `constitution.md`

Broken references are blocking — they mean the canon is internally inconsistent.

## Step 4 — Pass 2: scenario state

For each Story's scenario folders:

- Count `test()` (implemented) vs `test.todo()` (still TODO) vs `test.skip()` (intentionally skipped)
- If acceptance-listed scenarios are still TODO or skipped past merge, that's spec drift — the user-spec claims they hold, the test suite says they're not actually verified

Pass test runner output (if available from CI logs) to identify scenarios that are currently red.

## Step 5 — Pass 3: live behavior cross-check

For Stories whose `affects:` includes code repositories, query the code-perimeter for evidence that the behavior the Story claims actually holds in production. Typically this means invoking an `evidence-collector`-style specialist in each code repo that knows how to read its own observability surface.

You do not enter the code repo yourself. You ask for evidence.

For each piece of evidence returned:

- Confirms the Story's claim → no drift
- Contradicts the Story's claim → flag as implementation drift; the Story says X but the code does Y

## Step 6 — Pass 4: decision-history check

For each suspected drift, invoke `decision-historian` to check whether a structured commit in git history records an intentional change that should have propagated to the user-spec but did not. This distinguishes:

- "Drift" — nobody recorded a decision; the spec is stale and should be reconciled
- "Unpropagated decision" — a decision was recorded but the canon never caught up; the spec needs to be updated to match

The two have different remediation: the first goes to the Owner for re-confirmation; the second is a documentation gap that QC can drive to close.

## Step 7 — Build the report

Structure:

### /post-delivery-review: drift report `<date>`

**Scope:** (what was reviewed)

**Stories reviewed:** `<count>`

**Findings:**

For each Story with issues:
- Story: `<slug>`
- Drift type: spec drift / implementation drift / broken reference / unpropagated decision
- Severity: blocking / advisory
- Evidence: (specific quotes, test names, commit refs)
- Suggested remediation: (who fixes — Owner / QC / Implementer — and what)

**Clean Stories:** (count or list — confirms most of the system is OK)

**Process suggestions:** (if a pattern of drift emerges — e.g., "five Stories drifted on the same area; consider a constitution rule that prevents this class of drift")

## Step 8 — Output channel

The report's destination is project-configurable: a GitHub issue, a Notion page, a Slack post, a markdown file in the repo. Honor the project's convention. Default to writing to a markdown file under `reports/post-delivery-<date>.md` if no other channel is specified.

## Implementation notes

When refining the prompt, ensure it:

- Distinguishes "drift" from "intentional but unrecorded change" — the latter is a process gap, not a code problem
- Never tries to fix the drift itself — that violates the soft-assistance principle and prevents human judgment from staying in the loop
- Scopes its evidence-gathering carefully so a periodic sweep doesn't become a giant audit that nobody reads
