---
name: coverage-audit
description: Scan a repository, identify areas not yet under Story coverage, produce a prioritized backlog for catch-up.
model: sonnet
allowed-tools: Read, Bash, Glob, Grep, Agent
---

# /coverage-audit

Inventories what's covered by the canon and what isn't, then ranks the gaps. Output is a backlog the adopting team uses to plan quiet catch-up: which areas to backfill first, in what order, with what signals informing priority.

A coverage audit is most useful at the start of brownfield adoption (after Phase 0 silent landing, before Phase 2 enforcement expansion) and periodically thereafter — quarterly or per major release.

## Reads

- The full repository tree
- `stories/` — to identify what is already under a Story
- `constitution.md` — to know which invariants must be covered
- Git log — for touch frequency signals
- Public API surfaces (route definitions, exported types, GraphQL schemas) — for external-facing area identification
- Whatever security or customer-impact signals the project exposes (CODEOWNERS sensitive paths, security-relevant directories)

## Produces

- A prioritized backlog of catch-up candidates, each with:
  - Area description (path or module)
  - Touch frequency (commits over the last 6–12 months)
  - Public API surface (yes/no, with surface count)
  - Security exposure (auth, billing, data-handling, network egress — flagged if relevant)
  - Customer-facing visibility (user-visible behavior or pure internal)
  - Constitution rules likely in scope
  - Suggested priority (high / medium / low) with rationale
- A coverage statistic: percentage of recently-touched code that is under a Story, percentage of public API surface under a Story, percentage of constitution-relevant areas with explicit Story coverage

## Invokes

- `spec-spec` — for identifying areas where a Story should exist based on product positioning
- `architect-spec` — for constitution-coverage assessment
- Optionally code-perimeter analysis specialists when present, to pull in additional signals

## Mode

Invokable at any time. Typically scheduled (quarterly or per release) as well as manually for specific subdirectories.

## Implementation notes

When refining the prompt, ensure it:

- Does not produce a flat alphabetical list. Priorities have to be defensible — each item carries the signals that justify its position.
- Honestly reports coverage statistics. A repository with 5% coverage gets a 5% number, not a hopeful spin.
- Distinguishes "no Story exists" from "Story exists but is incomplete" — different remediation paths.
- Does not propose backfilling code that should be deleted. Old, unused areas should be flagged as deletion candidates, not added to the backlog.
