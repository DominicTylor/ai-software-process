---
name: scenario-implement
description: Fill executable code under existing scenario comments without removing them. Extends the framework's PageObjects with new verbs and their selectors when needed.
model: sonnet
allowed-tools: Read, Write, Edit, Glob, Grep, Agent
---

# /scenario-implement

Turns a comment-first scenario into a running test. Two-pronged operation: writes executable code under each existing comment (never replacing the comment), and extends the relevant framework with any new PageObject methods (or analogous helpers in non-e2e frameworks) the scenario requires.

This skill carries the **test-id half** of the framework's bilateral contract: when a new verb is introduced, the skill writes its PageObject method with an explicit `data-testid` selector. That selector becomes the code-perimeter's read-up source for what UI element to expose.

## Reads

- The scenario file with comments-only and `test.todo()` wrapping
- The relevant framework directory (e.g., `frameworks/e2e/page-objects/`)
- The Story's `user-spec.md` — for context the scenario does not state explicitly
- Existing framework vocabulary — to reuse verbs where applicable

## Produces

- Updated scenario file: each `// # <step>` comment now has executable code under it; `test.todo` becomes `test`; comments preserved
- Updated framework files: new PageObject methods (or helpers for security/perf/a11y) with explicit selectors and any necessary types
- A change summary listing every new verb added to the shared vocabulary (for Quality Gate Specialist review)

## Invokes

- `quality-spec` — for vocabulary decisions and framework structure
- Code-perimeter specialists relevant to the surface being tested (e.g., a frontend specialist for UI page objects, an API specialist for HTTP probes) — invoked via repo-level entry point, not directly

## Mode

Invokable in a branch. Not run automatically — implementation is an intentional act.

---

You are turning natural-language scenario comments into running tests. Two rules govern everything you do:

1. **Comments are sacred.** You may never delete or modify the `// # <step>` comments above the code you write. Each comment-and-code pair stays together for the life of the test.
2. **Selectors live in the framework, not the test.** When a new user action needs a selector, you create or extend a PageObject method in the framework. The test file calls that method by name. No `data-testid` strings appear in test bodies, ever.

These two rules give the bilateral contract its teeth.

## Step 1 — Read the scenario

Open the scenario file. For each `test.todo('...', ...)` block, list the comments inside in order. Each will become one code line (typically `await user.verb(args)`).

## Step 2 — Read the framework

`Glob` the relevant framework directory (`frameworks/e2e/page-objects/`, `frameworks/perf/`, `frameworks/security/`, `frameworks/a11y/`). Read existing PageObject files to inventory available verbs.

For each comment in the scenario, match it to one of:

- An existing framework verb (preferred)
- A verb you need to add (because the scenario describes an action the framework does not yet know)
- A Story-local helper (when the action is single-Story-specific and shouldn't pollute the shared dictionary)

## Step 3 — Read the user-spec for context

Some comments are deliberately short and rely on context from the user-spec. Read the spec to disambiguate (e.g., the comment says "Anna logs in" — the user-spec clarifies whether that means GitHub OAuth, magic link, or both).

## Step 4 — Invoke `quality-spec` for vocabulary decisions

For each verb you'd add to the framework, pass the proposed verb, its target action, and the context to the sub-agent. Ask:

- Is this verb at the right level of abstraction?
- Should it be a generic shared verb, or a Story-local helper?
- What selector name should it carry (when applicable)?

The sub-agent's answer governs your framework changes. Do not silently add verbs without this check.

## Step 5 — Extend the framework for new verbs

For each new generic verb, create or update the PageObject (or framework helper). The method signature should be minimal — clear name, typed arguments, no implementation leakage.

Example for an e2e PageObject method:

```ts
// frameworks/e2e/page-objects/login-page.ts
async entersEmail(email: string) {
  await this.page.fill('[data-testid="login-email"]', email);
}
```

The selector (`login-email` here) is the explicit half of the bilateral contract. Pick a name that is descriptive and stable — code-perimeter UI implementation will read it to know what `data-testid` to render.

For analogous non-e2e frameworks: perf helpers point at routes and payload shapes; security probes point at table-and-column names; a11y helpers point at landmark roles. Same principle — the framework declares; code-perimeter reads up.

## Step 6 — Write executable code under each comment

For each scenario in the file:

- Keep `// # <step>` comment as-is
- Below it, add the corresponding `await user.X(...)` (or `attacker.Y` / `probe.Z`) line
- Use existing or freshly-added framework verbs only — no inline selectors

When all comments have code below them, replace `test.todo(` with `test(`.

## Step 7 — Code-perimeter handoff (for new verbs)

When you add a verb that requires the code perimeter to expose a new `data-testid`, table, or route, signal that. The handoff is informational — you do not reach into code repositories yourself. Note in your output: "New framework verb `entersLoginEmail` requires UI to render `data-testid='login-email'` on the login form's email input." Code Owner picks up the requirement.

## Step 8 — Output

### /scenario-implement: implemented `<n>` scenario(s)

**Files changed:**
- Scenarios: (list)
- Framework: (list of PageObject/helper files updated)

**New framework verbs:** (each with: verb name, signature, selector name, code-perimeter requirement)

**Story-local helpers:** (verbs kept local to this Story rather than promoted)

**Pending for `quality-spec` ratification:** (any new generic verb the sub-agent flagged as uncertain — the Quality Gate Specialist signs off on the PR)

## Implementation notes

When refining the prompt, ensure it:

- Never silently widens a verb that should stay Story-local
- Never inlines a selector to "save time on a one-off"
- Always names selectors so code-perimeter reads them as obvious requirements, not arbitrary strings
