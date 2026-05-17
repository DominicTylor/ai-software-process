---
name: implement
description: Drive implementation in code repositories — hand off Story + tech spec + quality gates, let code-perimeter orchestrators take over.
model: sonnet
allowed-tools: Read, Glob, Grep, Agent
---

# /implement

The master-perimeter entry that initiates actual code work in one or more affected repositories. Like `/technical-spec-generate`, it does not write code itself — it packages context and hands off to code-perimeter orchestrators.

Distinct from `/technical-spec-generate`: that skill produces the *plan* (tech specs); this skill produces the *implementation*. In practice they are sequential — tech-spec changes get reviewed and merged in the code repository first, then `/implement` is invoked to do the actual build under those approved specs.

## Reads

- The Story being implemented
- The latest tech specs in affected code repositories (read-only — the master skill does not modify them)
- Quality gate notes and framework verbs that constrain the implementation
- `constitution.md` — invariants the implementation must respect

## Produces

- A structured implementation brief for each affected code repository
- An invocation of each repository's engineering entry point with that brief
- A consolidated report when all repositories return their results: what was built, what tests pass, what tests are still red, what requires re-coordination

## Invokes

- The **code-perimeter entry point** of each affected repository. Code-perimeter orchestrators internally call their own engineering, database, frontend, security, and SRE specialists; that composition is opaque to this skill.

## Mode

Invokable in a branch. Not run automatically.

---

You are coordinating an implementation across one or more code repositories. Your job is briefing, scheduling, and aggregating — not writing code. The same asymmetric-awareness rule as `/technical-spec-generate` applies: you provide context, the code perimeter does the work.

## Step 1 — Verify tech specs are in place

Before invoking implementation, confirm that `/technical-spec-generate` has been run and its outputs merged in the affected repositories. The tech specs are the plan; implementation without an approved plan is unsafe.

If tech specs are missing, refuse to proceed and surface the gap. The Implementer should run `/technical-spec-generate` first.

## Step 2 — Read the Story and current scenario state

Read the Story's `user-spec.md`. Note:

- Which scenarios are implemented (`test(`) versus still scaffolded (`test.todo(`)
- Quality gate notes and their executable references
- Architect tech notes that constrain implementation choices

Scenarios remaining as `test.todo` after implementation is a quality concern (`/quality-control-review` will flag them); aim to leave the Story with all acceptance scenarios green.

## Step 3 — Read constitution

Read `constitution.md` in full. Every rule applies to every implementation. The code perimeter is told to respect them, but you list the relevant ones explicitly so they cannot be "missed".

## Step 4 — Build the implementation brief

Per affected code repository:

```
# Implementation: Story <slug> → <repo>

## Story
<reference: stories/<grouping>/<slug>/user-spec.md>

## Tech-spec scope
<list of tech-spec PRs / merged tech-spec sections this implementation realizes>

## Quality gates to satisfy
- All e2e scenarios in stories/<slug>/e2e/ must go green
- Perf gate: G-X → ... (target threshold)
- Security gate: G-Y → ...

## Framework contract
This implementation must expose:
- data-testid="login-email" on the login email input
- Database table `account` with column `password` (must remain NULL in all rows)
- Route `POST /api/auth/signin/github` returning ...

## Constitution rules
- no-passwords: no code path persists a non-null password
- tenant-isolation: requests authenticated for workspace A must never read workspace B
- ...

## Entry instruction
Implement the changes in this repository per the tech specs above. Open one implementation PR per coherent change set. Run the local repo CI and any repo-specific gates. Report back when each PR is ready for code review or if you hit a blocker.
```

## Step 5 — Invoke code-perimeter entry points

For each affected repository, invoke its engineering entry point with the brief. The code perimeter's orchestrator decides which specialists to consult internally.

Wait for each response. Each repository may report:

- One or more implementation PRs opened
- Tests passing or failing per scenario
- A blocker that requires master-perimeter clarification (e.g., "the user-spec says X but to implement X we'd need Y, which violates constitution rule Z")

## Step 6 — Aggregate

Build a consolidated report:

### /implement: in flight across `<n>` repositories

**Story:** `<slug>`

**Per-repository status:**
- `<repo-1>`: PR `<url>` open; scenarios `<list> green, <list> still red`
- `<repo-2>`: blocker — "<description>"; needs Owner / Architect input

**Cross-repository coordination needed:** (if any — e.g., `<repo-1>` change depends on `<repo-2>` deploy, sequencing required)

**Open quality-gate items:** (scenarios still red, perf gates not yet measured, etc.)

## Step 7 — Loop until ready

This skill is invoked repeatedly as the work progresses. After Step 6, the Implementer:

- Addresses blockers (Owner/Architect clarifications)
- Re-invokes `/implement` to push the work further
- Or invokes `/rollout-help` once all PRs are green and ready to ship

## Implementation notes

When refining the prompt, ensure it correctly distinguishes "blocker that needs master-perimeter input" (you surface and stop) from "code-side complexity the code perimeter handles itself" (you do not touch). Misreading this leads to either premature escalation or silent drift.
