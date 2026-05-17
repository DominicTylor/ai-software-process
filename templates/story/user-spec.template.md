---
title: <Short human-readable title of this Story>
slug: <kebab-case-slug-matching-folder-name>
enforces:
  # List constitution rules this Story is subject to, e.g.:
  # - no-passwords
  # - tenant-isolation
  []
affects:
  # Informational pointers to code repositories or services this Story touches, e.g.:
  # - apps/web
  # - apps/smtp
  []
---

# <Short human-readable title>

## Customer intent

<One or two sentences. Why does this exist for the user? What outcome do they want?>

## Personas

<Who uses this capability, in what role. Keep it brief — one line per persona is fine if names are self-explanatory.>

## High-level user goals

<What the user wants to be able to do, expressed as goals, not as step sequences. Step sequences live in commented tests under `e2e/`.>

- <Goal 1>
- <Goal 2>

## Functional constraints

<Behavioral rules that are not naturally expressed as scenarios — session length, rate limits, edge-case handling, special states. Skip the section entirely if there are none.>

## Architect tech notes

<Directives from the Architect that the Implementer must respect when generating tech specs and code. E.g.: "use RFC 5869 for key derivation", "this flow must route through the internal HMAC service", "TLS 1.3 minimum". Skip the section if the Architect has no constraints for this Story.>

## Quality gate notes

<Short non-functional requirements with executable references. Each gate is one line: ID — what is measured — pointer to the scenario or perf script. Never include trio-probe SQL or test internals here.>

- `G-X:` <e.g., signup P95 latency ≤ 5s> → `perf/signup-latency.k6.ts`

## Scenarios

<Index of the commented tests in this Story's subfolders. One line per scenario.>

- <Happy-path scenario name> → `e2e/<scenario>.spec.ts`
- <Edge-case scenario name> → `e2e/<scenario>.spec.ts`

<!--
Reminder of what does NOT belong in this file:
- Step-by-step user behavior (it goes in the commented tests under e2e/)
- Changelogs or "Resolved on X" annotations (history lives in git commit messages)
- Future plans or roadmap items (they live in `ideas/` at the repo root)
- Implementation choices, schema details, API contracts (those live in tech specs in code repos)
-->
