---
name: backfill-story
description: Reverse-engineer a draft user-spec from an existing code area. Reads the code and current tests, produces an initial Story Spec for behavior the system already has.
model: sonnet
allowed-tools: Read, Write, Glob, Grep, Bash, Agent
---

# /backfill-story

Bootstraps a Story for code that already exists. Reads the area, infers what the system does today, scaffolds a user-spec with intent, personas, high-level goals, and initial scenarios. The Owner reviews and corrects; the AI does not assert what current behavior means without evidence.

Used in brownfield catch-up — both quiet (systematic backfill) and opportunistic (touch-triggered when a developer modifies legacy code).

## Reads

- The code area or module being backfilled (path, file, or set of files)
- Existing tests for that area (whatever shape — Playwright, Jest, integration, unit)
- `process.md` and `templates/story/user-spec.template.md` — for canonical user-spec shape
- `constitution.md` — to identify rules the area must respect
- Adjacent Stories already under `stories/` — for naming convention and related-Story surfacing

## Produces

- A Story folder scaffold (`stories/<grouping>/<slug>/`) copied from `templates/story/`
- A user-spec.md draft populated from observed behavior, with confidence markers — sections clearly tagged as "inferred from code" vs "inferred from tests" vs "needs Owner clarification"
- Initial commented test scaffolds in `e2e/` (or other folders as applicable) based on existing test coverage
- A list of open questions the Owner must resolve before the Story can move out of draft — "is this current behavior intentional or a bug?", "what was this designed to do?", "is this still used?"

## Invokes

- `spec-spec` — for product consistency, related-Story surfacing, and quality of inferred intent
- Optionally `architect-spec` — for invariants the existing code seems to violate or partially honor

## Mode

Invokable in a branch. Not run automatically.

## Implementation notes

When refining the prompt, ensure it:

- Never confidently declares "the system does X for reason Y" without quoting the evidence. Inferred intent is always tagged as inference.
- Distinguishes "behavior I can see in tests" from "behavior I can see in code" from "behavior I have to guess." The Owner cares about the difference.
- Surfaces bugs found during backfill as open questions, not as user-spec content. A backfill that papers over a known bug ships the bug as canonical.
- Recognizes when the area is genuinely unused or obsolete — flag rather than backfill code that should be deleted.
