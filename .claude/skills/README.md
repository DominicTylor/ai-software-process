# Skills

Master-perimeter skills — focused operations invokable as slash-commands. Each skill file follows the Claude Code skill format: YAML frontmatter (name, description, model, allowed-tools) plus a Markdown body describing the operation.

This directory also contains a **code-perimeter starter pack** (`check`, `eng-review`, `qa-review` in their own subdirectories) — generic operations for a code repository, written to read `AGENTS.md` at runtime so most adoption work happens by populating that file rather than by editing the skills.

See [`../../process.md`](../../process.md) § Skill philosophy and § Brownfield adoption for the operating model.

## Master-perimeter skills

| Skill | Purpose |
|---|---|
| `/spec-brainstorm` | Help shape a new Story from a brief |
| `/spec-review` | Check a drafted user-spec for consistency with the existing product |
| `/architect-review` | Architect's review of a Story — runs automatically on PR |
| `/quality-control-review` | Quality review of a Story — runs automatically on PR |
| `/ux-review` | UX review of a Story — runs automatically on user-visible Stories |
| `/scenario-generate` | Draft commented-test scaffolds from Story goals |
| `/scenario-implement` | Fill executable code under existing scenario comments; extend framework PageObjects |
| `/technical-spec-generate` | Hand off Story context into a code repository to update its tech specs |
| `/implement` | Drive implementation in code repositories |
| `/rollout-help` | Prepare delivery packaging — labels, sequence, rollback |
| `/post-delivery-review` | Scheduled drift check between merged Stories and current code |
| `/decision-search` | Search structured commit history for past decisions |

Each file documents its reads, outputs, invoked specialists, and mode. The prompt content evolves through use as real Stories surface concrete needs to encode.

## Brownfield-specific skills

Catch-up tooling for adopting the process on an existing codebase. See [`../../process.md`](../../process.md) § Brownfield adoption for context.

| Skill | Purpose |
|---|---|
| `/backfill-story` | Reverse-engineer a draft user-spec from an existing code area |
| `/legacy-test-convert` | Convert pre-canon tests into commented-test shape; extract selectors into framework PageObjects |
| `/coverage-audit` | Scan the repo and produce a prioritized catch-up backlog |
| `/legacy-decision-extract` | Surface significant behavior-changing commits from before adoption and suggest retroactive `decision/*` tags |

These are working tools, not blockers. An adopter who prefers to handle catch-up entirely by hand is not forced to use them.

## Code-perimeter starter pack

The subdirectories (`check/`, `eng-review/`, `qa-review/`) carry their own `SKILL.md` files. Each reads `AGENTS.md` for the canonical command list rather than hardcoding stack-specific commands. Adopt, adapt, or remove based on your stack.
