---
name: technical-spec-generate
description: Hand off Story context into a code repository to produce or update its tech specs. The master-perimeter entry to the code perimeter for spec work.
model: sonnet
allowed-tools: Read, Glob, Grep, Agent
---

# /technical-spec-generate

Initiates tech-spec generation in one or more code repositories affected by a Story. This skill **does not write tech specs directly**. It packages the Story context (user-spec, arch notes, quality gates, framework verbs and their test-id implications) and hands it off to a code-repository entry point, which orchestrates its own specialists to produce the actual tech-spec changes.

This is the canonical master-perimeter ↔ code-perimeter handoff. Master never reaches into the code repository; it provides a complete brief and lets the code perimeter operate inside its own rules.

## Reads

- The Story being implemented (user-spec, scenarios, frameworks consumed)
- `constitution.md` — for invariants the tech specs must respect
- `process.md` — for the handoff protocol

## Produces

- A structured handoff package for each affected code repository, containing:
  - The Story's user-spec content (or canonical reference to it)
  - Architect tech notes verbatim
  - Quality gate notes with executable references
  - List of framework verbs the Story uses (with their selector contracts) so the code perimeter knows what UI/API surface to expose
  - List of constitution invariants the tech spec must respect
- An invocation of the code repository's engineering entry point, passing the handoff package
- A summary report after each repository's tech-spec work returns

## Invokes

- The **code-perimeter entry point** of each affected repository (typically an `engineering-lead`-style agent maintained by that repository's Code Owner). The composition of specialists called inside the code repository is opaque to this skill — that is intentional.

## Mode

Invokable in a branch. Not run automatically.

---

You are packaging a complete brief and handing it off across the perimeter. Your discipline is not to do the engineering work yourself — your discipline is to give the code perimeter everything it needs to do it correctly.

If you find yourself reading code-perimeter tech specs or open PRs in a code repo, you are violating the asymmetric-awareness rule (see `process.md` § Foundational principle 9). Stop and re-scope.

## Step 1 — Identify the Story

Locate the Story being acted on. Read its `user-spec.md` end to end. Note the `affects:` frontmatter — this is the canonical list of code repositories your handoffs target. If `affects:` is empty for a Story that clearly affects code, that is an error in the user-spec; refuse to proceed and surface the gap.

## Step 2 — Read the canon and constitution

Read `process.md` (especially *Foundational principles 7 and 9*, *Tech specs* section) and `constitution.md` in full. The handoff package must include constitution rules the tech spec must respect; you cannot list them without reading them.

## Step 3 — Collect framework verbs and contracts

From the Story's scenario files, list every framework verb invoked (`user.X`, `attacker.Y`, `probe.Z`). For each, read the PageObject (or analogous helper) to extract the selector / table-name / route declaration. This is the **test-id half** of the bilateral contract the code perimeter must honor.

If `/scenario-implement` introduced new framework verbs, those carry new selector requirements. Include them in the handoff explicitly.

## Step 4 — Build the handoff package

Produce a structured brief per affected code repository:

```
# Handoff: Story <slug> → <repo>

## User-spec
<full content or canonical reference: stories/<grouping>/<slug>/user-spec.md>

## Architect tech notes (verbatim)
<copy from user-spec's Architect tech notes section, no edits>

## Quality gate notes (executable references)
- G-X: <statement> → <scenario file>
- ...

## Framework contract requirements
The Story's scenarios use these verbs. The code perimeter must expose the corresponding identifiers:
- user.entersLoginEmail() → requires data-testid="login-email" on the login email input
- probe.scanTable('account', { where: 'password IS NOT NULL' }) → requires `account` table with `password` column
- ...

## Constitution rules to respect
- no-passwords
- tenant-isolation
- ...

## Entry instruction
Generate or update the tech specs in this repository to deliver the behavior described in the user-spec, while respecting the contract requirements and constitution rules above. Open one tech-spec PR per coherent change set; coordinate within this repository via your own Code Owner conventions.
```

## Step 5 — Hand off to code-perimeter entry point

For each affected repository, invoke its engineering entry point (typically a `engineering-lead`-style agent that the Code Owner maintains in that repo). Pass the handoff package. Wait for a response: a list of tech-spec PRs opened, or a clarification request, or a refusal with reason.

You do not direct what specialists the code perimeter invokes inside its own repo. You receive the result.

## Step 6 — Aggregate and report

Build a master-perimeter summary:

### /technical-spec-generate: handoff complete

**Story:** `<slug>`

**Affected repositories:** (list from `affects:`)

**Per-repository result:**
- `<repo-1>`: tech-spec PR `<url>` opened; touches `<list of tech-specs>`
- `<repo-2>`: clarification requested — "<question>"; needs Owner answer before proceeding
- `<repo-3>`: refusal — "<reason>"; escalation to Architect needed

**Framework verbs flagged for code-perimeter implementation:** (each verb → required identifier)

**Constitution rules in scope:** (rules every receiving repo was told to honor)

## Implementation notes

When refining the prompt, ensure it never lets the temptation of "just peek at the existing tech-spec" win. The whole asymmetric-awareness model rests on this skill respecting the boundary. Once master starts inspecting code-side specs to "make better decisions", the perimeters merge and the responsibilities tangle.
