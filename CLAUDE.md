# Working in this repository

This is the canonical AI-Native Software Delivery process repository. As the AI agent, you are working **on the methodology**, not on a product that uses the methodology. Be conscious of that frame: changes you make here become rules other projects will follow.

## Read first

- `process.md` — the canon. Everything in this repo serves it.
- `CONTRIBUTING.md` — how changes get made, including the structured commit format the hook enforces.

If a request you receive seems to conflict with `process.md`, the canon wins until the canon itself is amended. Surface the conflict; do not silently comply.

## What this repo contains

- `process.md` — the methodology itself
- `constitution.md` — invariants for this canon repository (a real working constitution, not a template; adopters rewrite it in place)
- `README.md` — public-facing entry point for newcomers
- `CLAUDE.md` — this file, the AI agent's working guide for this repo
- `CONTRIBUTING.md` — contributor guide
- `LICENSE` — MIT No Attribution
- `templates/` — per-Story scaffolds skills use when creating new artifacts (not adoption-time setup material)
- `.claude/skills/` — Claude Code skill files. Master-perimeter workflows (`/spec-brainstorm`, `/architect-review`, etc.) plus a generic code-perimeter starter pack (`check`, `eng-review`, `qa-review`) that reads `AGENTS.md` at runtime.
- `.claude/agents/` — Claude Code sub-agent files. Master-perimeter specialists (`spec-spec`, `architect-spec`, `quality-spec`, `ui-ux-spec`, `decision-historian`) plus a generic code-perimeter starter pack (`engineering-lead`, `senior-developer`, `qa-lead`, and friends).
- `.githooks/commit-msg` — active hook enforcing structured behavioral commits
- `.github/CODEOWNERS` — areas of final word for this repo
- `.github/workflows/` — PR-side enforcement: `commit-format.yml`, `spec-validation.yml`, `ai-review.yml`

The repository is structured as **clone-and-go**: real working files (constitution, CODEOWNERS, CLAUDE.md, hook) live at their canonical locations. Adopters rewrite them in place rather than copying from a template directory.

## Operating rules when working here

1. **The process applies to this repo.** Behavioral changes go through branch + PR + structured commit + required approvals. Use the `commit-msg` hook locally: `git config core.hooksPath .githooks`.

2. **Skill and sub-agent files are Claude Code format.** YAML frontmatter (`name`, `description`, `model`, `allowed-tools`) plus a Markdown body. New skills go in `.claude/skills/`; new sub-agents in `.claude/agents/`. Do not invent a different shape.

3. **Templates are runtime contracts that skills read.** Files under `templates/` are scaffolding shapes that Story-creating skills (`/spec-brainstorm`, `/scenario-generate`, `/backfill-story`) open programmatically when producing new artifacts. Changing their shape changes the contract — that goes through PR + structured commit. They are not the same as the root-level files (`constitution.md`, `CLAUDE.md`, `CODEOWNERS`, `.githooks/commit-msg`) that adopters rewrite in place at clone time; those live at canonical locations precisely because they are not templates.

4. **Skills and sub-agents document the contract; prompts evolve through use.** Each file declares inputs, outputs, invoked specialists, and mode. When refining the body that drives AI behavior, those declarations are the constraints the prompt must respect — don't introduce inputs or outputs the contract doesn't mention without updating the contract first.

5. **When proposing a process change, engage with why the current shape exists.** The process was assembled by trading off alternatives. A commit that says "I think X is better" without addressing why the current X is what it is will be rejected.

## What this repo is NOT

- Not a product. Do not generate product code, application logic, deployment infrastructure, or business features here.
- Not a Claude Code plugin to be installed as-is into Claude Code itself. It is a scaffold an adopting project copies into its own master repository.
- Not the place to debug a specific project that has adopted the process. Issues from adopting projects belong in their own repos.
- Not a tool-agnostic abstraction layer. Skills and sub-agents are Claude Code format. Adapting them for another AI tool is a mechanical conversion, but this repo does not maintain the converted versions.

## Style

Process documents and templates are written in plain prose, not bullet salad. Long bulleted lists are appropriate when the items are genuinely a list (the nine principles, the skills table). Most explanation belongs in paragraphs. Match that voice when contributing.

Code examples in `process.md` and templates should be illustrative, not over-engineered. The reader is trying to understand the *shape* of a thing; a minimal example serves better than a complete production-grade one.

## When unsure

- Defer to `process.md`.
- If a request is ambiguous, flag it as an open question for human attention rather than guessing.
- If you would need to invent a new structural concept to satisfy a request, that is a signal: propose the concept in a PR description before adding it to the canon, do not slip it in.
