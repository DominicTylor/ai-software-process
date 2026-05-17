# Contributing

This repository defines the AI-Native Software Delivery process — and applies the process to its own evolution. Changes here go through the same shape the canon prescribes for any project: branch, structured commits, pull request, blocking review, required approvals, merge.

Before contributing, **read [`process.md`](./process.md) in full**. It is not long and there is no shortcut. Specifically the sections that matter for contribution:

- *Foundational principles* — what the process commits to and why
- *Decision log* — the structured commit format that this repository enforces
- *State and workflow* — how PRs gate changes
- *Skill philosophy* — how horizontal-role review works

What follows is the operational guide for actually opening a PR against this repo.

---

## One-time setup

After you clone, install the commit-msg hook so the structured commit format is enforced locally:

```bash
git config core.hooksPath .githooks
```

That's it. From this point, any commit message starting with `behavior:` must include `Why:`, `Considered:`, `Chose:`, and `Affects:` sections, or the commit will be rejected before it is recorded.

If you are on Windows and the hook does not execute, ensure the executable bit is set in the index:

```bash
git update-index --chmod=+x .githooks/commit-msg
```

(This is normally already in the index after cloning, but if you authored the file locally on Windows it may need to be set explicitly.)

---

## Making a change

1. **Branch** off `main`. Name your branch after what you're doing — `add-skill-spec-brainstorm-prompt`, `fix-typo-in-frameworks-section`, `propose-new-principle`.

2. **Commit as you go.** Use ordinary commit messages (`fix:`, `docs:`, `chore:`) for non-behavioral changes. Use `behavior:` for any change that alters what the process means — the structured format is required and the hook will enforce it. Example of a behavioral commit message:

   ```
   behavior: add ux-review skill to the mandatory horizontal-review set

   Why: Stories with user-visible state were being reviewed by quality-spec
   only, missing accessibility and copy gaps. Promoting ux-review to mandatory
   closes that hole.
   Considered: leaving ux-review invokable-only; merging it into quality-control.
   Chose: separate skill, mandatory on user-visible Stories. Distinct expertise
   warrants a distinct review run.
   Affects: process.md § Skill philosophy, .claude/skills/ux-review.md, README.md.
   ```

3. **Open a Pull Request.** Title it as the change you're making, in plain English. Mark it `Draft` if you are still iterating; promote it out of draft when ready for review.

4. **Resolve blocking review comments.** Horizontal-role review skills (`/architect-review`, `/quality-control-review`, `/ux-review` where applicable) post comments that must be resolved before merge. Resolution takes one of two forms — *fix* (address the concern) or *explicit acknowledgment* (a written statement accepting the risk with reasoning). Silent dismissal is not allowed.

5. **Collect required approvals.** CODEOWNERS enforces role-based approvals for the paths your PR touches. Until additional maintainers are added, the repo's CODEOWNERS file routes every domain to the current sole maintainer; that will change as the contributor base grows.

6. **Merge.** Once CI is green, blocking comments are resolved, and required approvals are present, the change merges.

---

## What kinds of contributions fit

The process repository accepts three rough categories of contribution.

### Process changes

Edits to `process.md` itself: refining a principle, clarifying a section, adding a new mechanism, removing one that turned out to be theoretical. These are by definition behavioral changes and require the full structured commit format.

Be honest about what you're proposing. The process was built by trading off many alternatives; if you want to change a structural decision, the `Considered:` section of your commit should engage with why the current shape exists, not just claim a new shape is better.

### Templates, skills, agents

Edits to anything under `templates/`, `.claude/skills/`, `.claude/agents/`. These are the contracts projects use when adopting the process. Changes here may or may not be behavioral — fixing a typo in a description is not behavioral; restructuring how a skill receives inputs is.

Skill and agent files document their contract (inputs, outputs, invoked specialists, mode); the prompt bodies inside evolve through real use. If you refine or expand a prompt, treat the result as a normal contribution: PR, structured commit if the shape of the skill changes, ordinary commit if you're refining the body. Discuss with maintainers before large prompt rewrites to avoid duplicate work.

### Bug reports and ideas

Open an issue. For ideas about future direction (not yet ready to ship), keep them in the issue tracker rather than authoring `ideas/` files in the canon repo — that folder is meant for adopting projects, not for this repo's roadmap.

---

## Style

The canon is written in plain prose, not bullet salad. Long bulleted lists are appropriate when the items are genuinely a list (the nine principles, the skills table). Most explanation is in paragraphs. Match that voice when contributing.

Code examples in process.md and templates should be illustrative, not over-engineered. The reader is trying to understand the *shape* of a thing; a minimal example serves better than a complete production-grade one.

---

## License

By contributing, you agree your contribution is released under the [MIT No Attribution](./LICENSE) license that covers the repository. Attribution is appreciated but not required.
