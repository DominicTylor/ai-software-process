# Templates

Per-Story scaffolds that skills consume when they create new artifacts. **Not** adoption-time setup material — that lives as real working files in the repository root (`constitution.md`, `.github/CODEOWNERS`, `CLAUDE.md`, `.githooks/commit-msg`) and is rewritten in place when forking the repo, not copied out of templates.

These templates exist so that `/spec-brainstorm`, `/scenario-generate`, and other Story-creating skills have a canonical starting shape to fill in. They are stable, machine-readable contracts about what new Stories and new scenarios look like.

## Contents

- `story/user-spec.template.md` — the canonical user-spec.md skeleton with frontmatter and required sections. `/spec-brainstorm` copies this into a new Story folder and fills it.
- `story/e2e-scenario.template.ts` — comment-first test scaffold. `/scenario-generate` produces files of this shape inside a Story's `e2e/` folder (and analogous shapes for perf/security/a11y).
- `story/README.md` — operational notes for the story templates.

## Why so few

Templates only earn their place if a skill actually reads from them. Everything else that used to be a "starter template" is now a real, working file at the root of this repository — `constitution.md`, `.github/CODEOWNERS`, `CLAUDE.md`, `.githooks/commit-msg`. When an adopting project clones this repository, those files are rewritten in place to match the project; there is no separate "copy-from-template" step.

The cleanest test for whether a file belongs here: would a skill open it programmatically as a starting shape? If yes, it belongs in `templates/`. If a human just reads it and writes their own version, it lives at the root as the canonical actual file.
