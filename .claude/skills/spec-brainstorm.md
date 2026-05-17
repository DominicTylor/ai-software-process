---
name: spec-brainstorm
description: Help the Owner shape a new Story from a brief — surface related Stories, propose personas, suggest applicable constitution invariants, draft initial user-spec sections.
model: sonnet
allowed-tools: Read, Write, Glob, Grep, Agent
---

# /spec-brainstorm

Turns a short product brief into the starting shape of a new Story. Invoked at the very beginning of a Story's life, before there is enough structure to review.

## Reads

- The brief the Owner provides (passed as argument or copied into the working area)
- `process.md` and `constitution.md` — to ground suggestions in the project's rules
- Existing Stories under `stories/` — to surface related work, avoid duplication, find adjacent flows
- Any project-level product description present in the repo (`product-requirements.md`, top-level `README.md`)

## Produces

- A Story folder skeleton (`stories/<grouping>/<slug>/user-spec.md` plus empty subfolders for relevant scenario types) copied from `templates/story/`
- A first pass at the `user-spec.md` sections, with placeholders where decisions remain
- A surfaced list of related Stories, applicable constitution invariants, and personas that may apply
- Open questions the Owner needs to answer before the Story moves out of draft

## Invokes

- `spec-spec` — for product consistency, related-Story surfacing, naming conventions
- Optionally `architect-spec` — for applicable invariant suggestions
- Optionally `ui-ux-spec` — when the brief implies user-visible state that needs personas and accessibility considerations

## Mode

Invokable in a branch. Not run automatically on PR.

---

You are helping the Owner turn a rough product idea into a properly-shaped Story. Your job is not to write the final spec — your job is to bootstrap it: produce a folder with a partially-filled user-spec and a list of open questions the Owner needs to think through before the Story can be reviewed.

Bias toward asking instead of assuming. A Story drafted with five honest open questions is far better than a Story padded with confident guesses the Owner has to unwind later.

## Step 1 — Read the brief

Receive the brief from the Owner (free-form text). Note what is concrete (specific users, specific behaviors) and what is vague (verbs like "improve", "support", "integrate" without specifics). Vague parts become open questions, not assumed answers.

## Step 2 — Ground in the canon and constitution

Read the relevant sections of `process.md` (especially *Artifact ontology → Story* and *Artifact ontology → user-spec.md*) and the full `constitution.md`. The Story you draft must respect both.

## Step 3 — Read project context

If `product-requirements.md` or a similar top-level product description exists, read it. The brief must fit the product's positioning; if it does not, that is the first question for the Owner.

## Step 4 — Survey adjacent Stories

Use `Glob` on `stories/**/user-spec.md`. Skim slugs and titles. For any that seem related — by area, by personas, by flow — read the user-spec and note overlaps. The new Story may build on, extend, or contradict existing ones; surface this rather than silently ignoring it.

## Step 5 — Invoke specialists

Pass the brief, the related Stories, and the product description to:

- `spec-spec` — for product-fit and related-Story analysis
- `architect-spec` — for which constitution invariants the Story is likely to touch, and any architectural concerns worth flagging early
- `ui-ux-spec` — only if the brief implies user-visible state

Collect their structured outputs. Their job is to surface facts and confidence; yours is to use those facts when drafting.

## Step 6 — Draft the Story folder

Pick a slug for the Story (kebab-case, descriptive, project's grouping convention from existing Stories). Create:

- `stories/<grouping>/<slug>/user-spec.md` — start from `templates/story/user-spec.template.md`
- `stories/<grouping>/<slug>/e2e/` — empty folder, ready for `/scenario-generate`
- Other scenario subfolders (`perf/`, `security/`, `a11y/`) — only if the specialists indicated relevance

Fill in the user-spec sections based on what is known. For each section:

- If you have a clear answer from the brief, write it
- If you have a partial answer with caveats, write it and mark the caveat as an open question
- If the section is not yet decided, write `<TBD: brief description of what needs to be decided>` and add it to the open-questions list below

## Step 7 — Surface open questions

Append to the bottom of the draft user-spec (or in a separate working notes file) a list of explicit open questions the Owner must resolve before the Story can move out of draft. These are not decoration — they are the gate that prevents this Story from advancing prematurely.

## Step 8 — Output

Report to the Owner:

### /spec-brainstorm: drafted Story `<slug>`

**Folder created:** `stories/<grouping>/<slug>/`

**Filled sections:** (list of sections that have a confident draft)

**Sections needing Owner decisions:** (list of sections marked TBD)

**Related Stories surfaced:** (list of slugs and the relationship — "extends", "may conflict", "depends on")

**Applicable invariants:** (list of constitution rule slugs the Story likely needs to declare in `enforces:`)

**Open questions:** (numbered list — these block the Story from advancing)

## Implementation notes

When refining the prompt, ensure it preserves the bias toward open questions over confident guesses. The single biggest failure mode of this skill is producing a polished-looking draft that papers over genuine ambiguity; the Owner then either ships a wrong Story or has to unwind assumptions later. Honest TBDs are better than false confidence.
