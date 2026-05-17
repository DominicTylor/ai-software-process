# AI-Native Software Delivery — Process

> **Authoritative reference** for the delivery process this canon defines. This is the methodology document; projects adopting the process copy it into their master repository and treat it as the source of truth for how Stories are written, validated, implemented, and shipped.
> **Scope:** how Stories are written, validated, implemented, and shipped — and what artifacts exist to support that flow.

---

## Why this exists

Software delivery has historically optimized around implementation specialization. People owned modules, code, and the act of writing it. As AI generation becomes the default way to produce implementation, that center of gravity moves. Humans increasingly own intent, validation, constraints, and behavioral guarantees; AI increasingly produces the code that satisfies them. This document describes a delivery process designed for that reality from the ground up — not retrofitted onto traditional roles.

The single test of this process is whether it reliably ships customer-visible behavior. Everything else — artifact shapes, ownership boundaries, gating mechanics — exists only to serve that outcome.

---

## Foundational principles

These nine principles govern every structural decision below. When something in this document conflicts with them, the document is wrong.

1. **A Story Spec describes only current behavior.** Not history, not future plans, not the journey of how we got there, not parked ideas. If the system behaves this way right now, it goes in the spec. Anything else lives elsewhere.

2. **The process is designed from first principles, not adapted to current role habits.** When the optimal place to write acceptance criteria is a commented test file, the role that writes acceptance criteria writes test files. We do not introduce intermediate artifacts to make existing job titles comfortable.

3. **Acceptance criteria live as commented executable tests.** Step-by-step user behavior is expressed once, in a place that is both human-readable and machine-verifiable. Prose duplication of steps in Markdown is not allowed.

4. **Decision history lives in git commit messages, structured and addressable.** No changelogs inside artifacts. No "Resolved on …" annotations inside Story Specs. The git log, with disciplined commit format and tags, is the single source of truth for why the system is the way it is.

5. **State is computed from git, not declared in fields.** A Story's progress is a function of branches, pull requests, CI status, and approvals. No status string in a header. No external state store. Git is the truth.

6. **Skills are soft assistance inside a branch, hard gates on the pull request.** While work is private, the team is free to use AI helpers or ignore them. Once a pull request is opened, automated review and CI become non-negotiable: required checks, required approvals, no merge without them.

7. **Master-repository and code-repositories are separate worlds.** The master repository owns Story Specs, executable acceptance tests, frameworks, and constitution. Code repositories own technical specs, implementation, and code review. The two communicate through references, never through reach-down: a skill in the Story layer never reaches into a code repo's open PRs and vice versa.

8. **Canon describes what we agreed; infrastructure enforces what cannot be left to discipline.** This document does not restate rules that branch protection, CI configuration, or commit-msg hooks already enforce. Where a rule must hold absolutely (no direct pushes to main, no commits without a structured message for behavioral changes, no merge without required approvals), it is wired into the Git platform and the hook layer. The canon describes decisions that remain open to human and AI judgment.

9. **The master perimeter sits above the code perimeter, and awareness is asymmetric.** Master-perimeter artifacts — Stories, frameworks, constitution, this document — describe customer-visible behavior and platform-wide rules. Code-perimeter artifacts — tech specs, implementation, code review — describe how the system delivers that behavior. Master never reaches down into code repositories; the only references it carries downward are informational pointers ("this Story affects components A, B, C → repository URLs"). Code, by contrast, reads up: to generate a tech spec or implementation, a code-perimeter worker must fully understand the upstream user-spec, architecture notes, quality gates, and test-id contracts coming from the framework. Master is the source; code is the consumer.

---

## Artifact ontology

### Perimeters

The system lives in two perimeters with asymmetric awareness.

The **master perimeter** is a single repository that owns Stories, frameworks, the constitution, and this canon. It is product-level and behavior-level. The Owner and horizontal roles (Architect, Quality Gate Specialist, UI/UX Specialist) do their primary work here. In small projects this perimeter may coexist with code in the same physical repository, but the boundary between perimeters remains conceptual.

The **code perimeter** is one or more code repositories, each with its own tech specs, implementation, code-review configuration, and AI-agent set tailored to its stack. The Code Owner of each repository governs it. Code repositories carry their own local contracts (typically an `AGENTS.md`-style file) describing engineering constraints inside that repo.

Awareness flows in one direction only. The master perimeter does not query, inspect, or coordinate with code repositories — its references to them are descriptive ("this Story affects services A and B"), not operational. A skill running in the master perimeter never opens a code repository's pull request list, never reads code-side tech specs to decide what to do, never coordinates code-side merges. Cross-code-repo coordination, when two Stories touch the same code, is the responsibility of that code repository's Code Owner.

The code perimeter, in contrast, reads the master perimeter as its source of truth. To produce a tech spec, an engineering agent in a code repository reads the corresponding Story's user-spec, the architect's tech notes inside it, the quality gates, the constitution rules it must respect, and the framework's test-id contract. The code-perimeter worker must fully understand all of this; if any of it is unclear or missing, the work cannot proceed and the question goes back up to the master perimeter.

This asymmetric coupling keeps responsibilities clean: the master perimeter never has to know about deployment topology, CI runners, or how many code repositories the company has; the code perimeter never has to argue with product about what a feature should do.

### Story

A Story is the unit of work. Physically, a Story is a folder under `stories/`, not a single document. Every Story has the same shape:

```
stories/<project-specific-grouping>/<slug>/
  user-spec.md
  e2e/
    <scenario>.spec.ts
  perf/
    <scenario>.k6.ts        # optional
  security/
    <scenario>.spec.ts      # optional
  a11y/
    <scenario>.spec.ts      # optional
```

The internal grouping under `stories/` — by phase, by product domain (`auth/`, `emails/`, `settings/`), flat, or any combination — is a per-project convention, not canon. Process describes the Story shape; the project chooses how to organize Stories on disk.

All Stories share this shape. There is no Story-level type or category at the canon level. A Story is a Story, whether it describes a user-facing capability (a user signs up), an architect-driven constraint (an attempt to reach a forbidden port is refused), or a slowly-materializing concern (notification preferences). Any further classification — by phase, by product area, by who initiated it — is metadata a project may attach for its own navigation; it does not change the Story's shape or behavior.

Stories are **collaboratively authored**. Anyone who has something to contribute writes into a Story: Owner sets intent; Architect adds tech notes or proposes constraints; Quality Gate Specialist refines scenarios and gate notes; UI/UX Specialist adds accessibility and copy requirements; Implementer adds details that surface during work. A Story does not "belong" to a role. What roles do hold are **areas of final word** — see the Roles section below — and those are enforced through CODEOWNERS, not through Story-level ownership fields.

Persona is a per-scenario attribute, not a per-Story one. One Story can legitimately contain `e2e/signs-up.spec.ts` with a happy-path persona and `security/cannot-brute-force-totp.spec.ts` with an attacker persona in the same folder. The persona is implicit in the scenario's name, comments, and helpers (`user.X()` vs `attacker.Y()` vs `probe.Z()`). It does not need a top-level classification.

There is no separate "cross-cutting" category. What used to be cross-cutting decomposes into the structures that already exist: a constitution rule (if it's a platform-wide invariant), a Story that demonstrates the invariant's enforcement, a regular Story (if it's a user-facing capability), or part of an existing Story (if it's a per-flow concern such as a specific notification on a specific event).

### user-spec.md

The user-spec is the entry point to a Story for any reader. It describes intent, audience, and constraints, but does not duplicate executable behavior. It contains:

- **Customer intent** — one or two sentences. Why does this exist for the user?
- **Personas** — who uses this capability, in what role
- **High-level user goals** — what the user wants to be able to do, expressed as goals, not as step sequences
- **Functional constraints** — behavioral rules that are not naturally expressed as scenarios (session length, rate limits, edge-case handling)
- **Architect tech notes** — directives from the Architect role that the Implementer must respect when generating the tech spec and code (e.g., "use RFC 5869 for key derivation, not raw HMAC", "this flow must route through the internal HMAC service", "TLS 1.3 minimum")
- **Quality gate notes** — short non-functional requirements with executable references (e.g., `G-X: signup P95 latency ≤ 5s → perf/signup-latency.k6.ts`); never trio-probe SQL inside the spec
- **Scenario index** — list of scenarios with links to commented test files in this Story's subfolders
- **Invariant references** — list of constitution invariants this Story is subject to, by ID

What does NOT live in the user-spec:

- Step-by-step scenarios (they live in commented tests)
- Changelogs or version history (in git)
- "Resolved" or historical open questions (in git, or simply absent)
- Future-state behavior (in `ideas/`)
- Implementation choices (in tech specs in code repos)

If a section is empty for this Story, it is omitted, not stubbed.

### Commented tests

Commented tests are the primary site of acceptance criteria. The Owner (or whoever drives the Story) writes the scenarios first as a sequence of natural-language comments inside a `test()` block. An AI helper, or the Implementer, later fills in executable code under each comment without removing the comment. The comment remains as documentation; the code remains as verification. They stay together for the life of the test.

```ts
test('User logs in via GitHub for the first time', async ({ user }) => {
  // # User opens the signup page
  await user.opensSignupPage();

  // # User sees three auth options with GitHub marked as recommended
  await user.seesAuthOptions({ recommended: 'github' });

  // # User clicks "Continue with GitHub"
  await user.clicksContinueWithGitHub();

  // # System completes OAuth and lands the user on an empty workspace dashboard
  await user.expectsDashboardWithEmptyWorkspace();
});
```

The same form applies to invariant Stories, with the persona reversed:

```ts
test('Attacker attempts password login — endpoint does not exist', async ({ attacker }) => {
  // # Attacker posts a password payload to the email sign-in endpoint
  await attacker.attemptsPasswordSignIn({ email: 'user@example.com', password: 'whatever' });

  // # System returns 404 because the endpoint is not registered
  await attacker.expectsResponse({ status: 404 });
});
```

This format produces three benefits with no extra effort. The Owner reads only the comments to verify acceptance criteria. The Quality Gate Specialist reads code and comments together to verify they agree. Drift between described behavior and verified behavior is physically impossible: they share a file and appear in the same diff.

A test that has only comments and no code under them is wrapped in `test.todo()` and counts as scaffolding — it appears in the test runner as TODO, contributing to a Story's observable state.

### Frameworks

E2E, performance, security, and accessibility frameworks live at the master-perimeter root and are owned by the Quality Gate Specialist. Each framework hides its implementation behind a vocabulary that reads like acceptance criteria: `user.clicksContinueWithGitHub()`, `attacker.attemptsPasswordSignIn()`, `probe.scanTable(...)`. Frameworks define and maintain that vocabulary; Stories consume it.

A framework is a **bilateral contract**: it holds one end of the agreement facing the master perimeter (user-action vocabulary used in commented tests) and another end facing the code perimeter (the concrete identifiers, selectors, and routes that the code must produce so the framework's actions resolve). The contract is not implicit — it lives as readable code. When the framework defines a user verb like `user.entersLoginEmail()`, the corresponding **PageObject method** inside the framework holds the actual selector:

```ts
// frameworks/e2e/page-objects/login-page.ts
class LoginPage {
  async entersEmail(email: string) {
    await this.page.fill('[data-testid="login-email"]', email);
  }
}
```

The test-id `"login-email"` lives in this file, in plain code. Code-perimeter implementation reads this file to learn what the UI must expose. There is no separate test-id registry; the framework's PageObjects are the registry. A code-perimeter agent producing the login UI opens `frameworks/e2e/page-objects/login-page.ts`, sees the selector, and renders an input with `data-testid="login-email"`. Failure to do so manifests as a failed scenario — the right feedback channel.

The same pattern applies to the other frameworks. A `probe.scanTable('account', { where: 'password IS NOT NULL' })` call in the security framework rests on a database probe helper that names the table and column explicitly; code that creates the schema reads that helper to know what names are expected. A `perfClient.runLoginRequest()` call in the perf framework rests on a route definition the helper expects; code that implements the route reads that helper to know its shape.

When a Story needs a new verb that is genuinely generic, the Implementer (or the `/scenario-implement` skill on their behalf) proposes the new verb together with its PageObject implementation; the Quality Gate Specialist accepts both into the shared framework. Accepting a verb and accepting its selector contract are the same act. When a verb is single-Story-specific, it stays local to that Story's helpers without polluting the shared dictionary.

Stories never expose selectors, `data-testid` strings, sleeps, mocks, network stubs, or implementation-specific state directly. Those live inside framework internals — where the code perimeter can find them.

### Constitution

`constitution.md` at the repository root is a standalone, prose document that states the platform's invariant rules. It is self-contained: a new reader opens it and learns what must always be true about the system, without needing to follow links elsewhere. Each rule is articulated clearly enough that any subsequent decision can be checked against it.

A representative constitution includes rules such as:

- No user password is ever stored, transmitted, or accepted by any code path.
- Service X never originates outgoing connections on the forbidden ports.
- No request authenticated by tenant A can read or modify data belonging to tenant B. Cross-tenant access attempts return 404 or 403, never 500 and never partial data.
- All persistent data is encrypted at rest under platform-managed keys.
- Every security-significant action produces a synchronous audit-log entry.
- A user's right to data export and deletion is honored within the deadlines set by applicable regulation.

The constitution is written by the Architect (or whoever holds that role at a given moment), with input from other roles where the rule touches their domain. It changes through the same workflow as any other artifact: branch, PR, ai-review, approvals, merge.

The constitution does not list Stories. It does not reach down to executable artifacts. It describes what must hold; how it manifests is the job of the Stories that touch the relevant area.

Executable verification of constitution rules lives in **regular Stories** under `stories/` — typically initiated by the Architect, but with no structural difference from any other Story. The Story's scenarios use an attacker or system-probe persona, and they attempt to violate the rule and verify the violation is refused:

```ts
test('Attempts to log in with password — endpoint does not exist', async ({ attacker }) => {
  // # Attacker posts a password payload to the email sign-in endpoint
  await attacker.attemptsPasswordSignIn({ email: 'user@example.com', password: 'whatever' });

  // # System returns 404 — the endpoint is not registered
  await attacker.expectsResponse({ status: 404 });
});

test('Database scan: no row in account table carries a non-null password', async ({ probe }) => {
  // # Probe queries the account table for any non-null password value
  const count = await probe.scanTable('account', { where: 'password IS NOT NULL' });

  // # Count must be exactly zero — no code path has ever written a password
  expect(count).toBe(0);
});
```

A Story may reference a constitution rule it depends on (`enforces: constitution §3.2`) for traceability. The constitution itself does not reference back; it does not need to know how each rule is verified or by which Story.

The Architect-review skill, when reviewing any Story, reads both the constitution and the Story and flags any rule the Story touches without a clear path to compliance — typically by pointing to an existing Story that already covers that rule, or by requiring the Story to add a scenario that demonstrates compliance in its own context.

### Tech specs

Tech specs do not live in the master repository. They live inside the affected code repositories, alongside the code they describe. The relationship between Stories and tech specs is many-to-many: one Story may modify three existing tech specs and create two new ones; one tech spec may accumulate input from many Stories over time.

A Story declares which tech specs it touches via a reference in its `user-spec.md`. The Implementer, when working on a Story, opens a branch in each affected code repository and regenerates the tech specs there using a skill. Updates to multiple tech specs within one repository are atomic — one commit, one merge.

The Story layer never reaches into a code repository to inspect open pull requests or scheduled work. Coordination across parallel modifications of the same tech spec is the responsibility of the Code Owner of that repository, supported by repository-level code-review skills.

### Future and ideas

`ideas/` contains anything that is not current behavior. Brainstorming notes, rough sketches, capabilities being considered for next quarter, half-formed proposals. These are not Stories. They have no lifecycle, no gates, no approvals. They are working material.

When an idea matures into something we intend to ship, it becomes a new Story (or an amendment to an existing one) and follows the normal flow. Until that moment, it stays in `ideas/` and is not subject to process discipline.

### Decision log

There is no separate decision-log artifact. Decisions live in git commit messages, in a structured format that applies to **every commit that changes behavior** — anywhere in the system, regardless of whether it is part of a Story PR, a hotfix, a tech-spec update in a code repository, or a constitution amendment. This rule is enforced by a `commit-msg` git hook, not by social discipline.

A behavioral commit message has the following sections:

```
behavior: drop password auth from auth flow

Why: minimize attack surface; password storage adds risk for a developer-tool
audience that is comfortable with OAuth and magic links.
Considered: keep with bcrypt, move to passkeys only, drop entirely.
Chose: drop entirely; OAuth + magic link cover all signup and login paths.
Affects: stories/auth/user-signup/, constitution.md §3.2.
```

Significant decisions are tagged for addressability:

```
git tag decision/no-password-auth <sha>
git tag -l "decision/*"
```

To answer "why did we decide X?", the workflow is `git log --grep=...`, follow tags, read the structured sections of the relevant commit. Skills can automate this lookup; the storage layer is just git.

Commit format is a system-wide rule. The PR workflow described below is a separate mechanism that applies specifically to Story changes. The two intersect — a Story PR contains commits, and those commits follow the format — but the format is enforced even when a change is made outside a Story.

---

## Roles

Roles are responsibilities, not positions. In a small team or a solo project, one person holds several roles and shifts mode depending on the artifact in front of them. In a larger team, roles tend toward distinct people. The boundaries between roles stay the same regardless of headcount.

Stories are written collaboratively: anyone with something to contribute writes into a Story. What roles hold is not Story ownership but **areas of final word** — domains where, when a decision is contested, that role's approval is required to ship. These areas are enforced by CODEOWNERS rules on the relevant path patterns, not by social convention.

A second pattern governs how non-final-word roles still carry real weight: **mandatory review with required engagement**. Horizontal roles — Architect, Quality Gate Specialist, UI/UX Specialist — are not optional advisors who the Owner can choose to ignore. Their review of every relevant Story is automatic and their comments are blocking. The Owner is free to overrule their advice in the Owner's own product domain, but only by **explicit acknowledgment**: a written statement that the risk is read, accepted, and carried. Silent dismissal is not an option. The mechanism is described in detail in the Skill philosophy section; the key point here is that horizontal roles have process-level weight even where they lack final-word authority.

**Owner.** Host of the project. Final word on product decisions: what the product does, which user journeys exist, which UX trade-offs are acceptable, which risks the business takes. Holds CODEOWNERS over `stories/**/user-spec.md`. May overrule horizontal-role advice in the product domain — but only by acknowledging each concern explicitly. For example, if the Architect warns "use the standard hashing scheme, not the legacy one", the Owner may decide otherwise by writing into the PR a clear acknowledgment of the risk and the rationale ("accepting legacy scheme because deployment is VPN-only and the threat model does not include public exposure"). The decision is the Owner's; the acknowledgment is the Owner's; the consequence is the Owner's. What the Owner cannot do is leave the Architect's comment unaddressed. If the same change touches the constitution, it crosses into the Architect's final-word domain and requires Architect approval — at which point an unresolved disagreement escalates to a constitution PR rather than being absorbed silently.

**Architect.** Final word on the constitution and on architectural invariants — the rules that hold across all Stories. Holds CODEOWNERS over `constitution.md` and over architectural-baseline artifacts. Reviews every Story that touches an architectural concern: the architect-review skill runs automatically on the PR, the Architect's comments are blocking until addressed, and the Architect is expected to engage personally with non-trivial cases. When the Architect believes a Story's acknowledged risk is actually systemic rather than local, the open path is to open a constitution PR proposing a new platform rule — that move shifts the discussion from Story scope (Owner's call) to platform scope (Architect's call).

**Quality Gate Specialist.** Final word on quality gates and the frameworks that implement them. Holds CODEOWNERS over `frameworks/**` and over scenario folders (`stories/**/e2e/`, `stories/**/perf/`, `stories/**/security/`, `stories/**/a11y/`). The quality-control-review skill runs automatically on every Story PR; comments on missing coverage, weak assertions, or vocabulary misuse are blocking. Maintains the shared user-action vocabulary; ratifies new framework verbs proposed by Implementers.

**Implementer.** Drives the work of translating an approved Story into running code: opens branches in affected code repositories, regenerates tech-specs, generates implementation under AI assistance, ensures repo-local validation passes, prepares the delivery package. Implementer is a role of execution, not of final-word governance. Implementer's approvals matter wherever they also hold one of the other roles (e.g., Code Owner of an affected repo).

**Code Owner.** Final word on each code repository's compliance: CI/CD configuration, repository conventions, AI-reviewer configuration, the code-review gate on merge into that repository. Holds CODEOWNERS within their repo. One person can be Code Owner of multiple repos; one repo can have multiple Code Owners with internal path-based subdivisions.

**UI/UX Specialist.** Final word on user-visible completeness: copy, accessibility, responsive behavior, alignment with the design system. Holds CODEOWNERS over `stories/**/a11y/` (jointly with Quality Gate Specialist) and over design-system artifacts. The ux-review skill runs automatically on every Story that affects user-visible state; its comments are blocking until addressed.

A single person may, and often does, hold several of these roles. The role structure stays useful even then, because it tells the person which domain they are deciding in and which approvals their commits will require when they open a PR. When one human plays Owner and Architect at the same time, they still consciously switch contexts: when reviewing a constitution change, they ask "is this architecturally sound?"; when reviewing a user-spec change, they ask "is this the right product call given the costs?". The acknowledgment-of-risk mechanism applies to themselves too — a single human cannot silently overrule one of their own hats.

---

## State and workflow

### The tracked unit is a change vector, not a file

The process tracks **change vectors** — combinations of `(branch, PR)` against the master repository. A change vector is not a Story file, not a folder, not a feature description. It is the unit of in-flight work that can be observed, owned, and gated. One vector can touch any number of files; what makes it a vector is that it lives as a branch with an associated workflow.

Every vector has an observable state derived from three facts: does the branch exist, is a pull request open against master, and what is the PR's status. No status field is declared anywhere; the state is whatever git and the forge say it is.

| Branch | PR | Vector state |
|---|---|---|
| Does not exist (never existed, or merged into master) | — | Does not exist, or the change is live |
| Exists, no PR | — | Private work in progress |
| Exists, PR open in any state (draft, closed, open) | Draft / Closed | Still in private work — the contributor is iterating |
| Exists, PR open and not draft / not closed | Open | Under review, collecting approvals |
| Exists, PR open, all approvals + CI green | Open | Ready to merge |
| Merged | Merged | Live |

A few clarifications that follow from this model:

- **A closed-without-merge PR is not a special state.** As long as the branch exists, the vector is still in private work; the contributor is iterating and may reopen or open a fresh PR. When the branch is gone, the vector ceases to exist.
- **Reopening a long-paused effort means a new vector.** If a branch was deleted three months ago and the work resumes, a fresh branch is opened and that is the tracked vector. The process does not maintain a notion of "attempt history" — git carries that.
- **A vector that returns to an already-live area is itself a new vector.** Editing a previously-merged Story is not "the same Story continuing"; it is a new branch with new PR, observed and gated independently. The previous merged state is what `main` already shows.
- **Vector scope can grow during the work.** If one branch ends up covering more behavior than originally intended, that is a single vector for tracking purposes. The process does not split it. When the PR becomes too large to review meaningfully, that is the signal to split — a human decision, not a process rule.
- **Two parallel branches modifying the same area are two tracked vectors, and that is a red flag.** It means the same change is being attempted twice in parallel — almost always a coordination miss. Tooling on top of the process (a dashboard, a query) can surface this; the process itself does not block it.

### State always has an owner

The tracking model exists so that for any in-flight vector, **someone is identifiable as the person to ask**. There is no homeless state. The owner of a vector at any moment is the person whose role's final-word approval is still missing, or — when no approval is missing — the contributor who opened the branch and is responsible for moving it forward. This is mechanical: CODEOWNERS resolves the "who" given the path patterns the vector touches and the approval status of the PR.

The overview of all vectors in flight is `git branch -a` plus the forge's PR list. A dashboard, if and when one exists, is a view over those facts — never a separate source of truth.

### Gates on the pull request

Once a PR is opened, three layers of enforcement engage:

- **CI checks** validate that `user-spec.md` matches the schema, the test runner reports no unaccounted-for failures, frameworks remain coherent, the constitution is not violated by the changes.
- **CODEOWNERS** enforces role-based approvals on path patterns: changes under `stories/**/user-spec.md` require Owner approval; under `stories/**/e2e/`, Quality Gate Specialist approval; constitution changes require Architect approval; and so on.
- **ai-review** runs automatically on every push to a non-draft PR. It comments on missing coverage, scenarios that don't match the spec, gate notes without test references, architectural concerns, and constitutional conflicts. Blocking ai-review comments must be resolved before approvals count.

No merge without all three. This is the only place in the process where automation says "no" to a person.

### Parallel work

Multiple branches mean multiple vectors in flight. The observable overview answers questions like "which vectors are private work?", "which are under review?", "who is the blocking approver?" without any separate tool. When two vectors touch the same tech spec in a code repository, normal git mechanics (rebase, merge conflict resolution) apply; coordination is the Code Owner's responsibility, not the master-repo's concern. When two vectors touch the same Story or area in the master repo, the red-flag rule above applies — that is a coordination miss to be surfaced and resolved, not a state to be silently sustained.

---

## Sub-agents as specialists

Skills perform focused operations. Sub-agents are role-specialists with deeper expertise in a single domain, invoked by skills (or directly by humans) when judgment in that domain is required. A skill is a verb; a sub-agent is a role.

This separation mirrors how humans organize: a workflow operation (review this Story, generate that tech-spec) is a skill; an expert who can reason inside a domain is an agent. Skills may invoke one specialist, several specialists in coordination, or none at all when the operation does not require domain reasoning. The skill is responsible for the result; the specialists it consults are implementation detail.

**Master-perimeter specialists** are domain experts on the master-perimeter contracts. They read `process.md`, `constitution.md`, relevant user-specs, and framework vocabularies; they do not enter code repositories.

| Specialist | Domain |
|---|---|
| `spec-spec` | Story Spec format, product consistency, related Stories, existing flows, product-requirements alignment |
| `architect-spec` | Constitution rules, system-wide invariants, architectural baselines, technical standards |
| `quality-spec` | Quality gates, framework vocabulary, scenario coverage and strength, gate-to-test mapping |
| `ui-ux-spec` | User-visible completeness, accessibility, design-system alignment, copy and tone |
| `decision-historian` | Git history of structured commit decisions; answers "why was X decided?" by reading commit messages and tags |

**Code-perimeter specialists** live inside each code repository. Their composition depends on the repository's stack and is governed by the Code Owner, not by this canon. Typical roles include an engineering-lead (orchestrator), repo-specific specialists (backend, frontend, database, security), and QA-side specialists (api-tester, performance-benchmarker, accessibility-auditor, reality-checker). The master perimeter knows that these specialists exist behind code-perimeter handoffs but does not enumerate them; each code repository defines and curates its own set.

When a master-perimeter skill needs work done in a code repository, it does not invoke code-perimeter specialists directly. It hands off the Story context (user-spec reference, arch notes, quality gates, applicable framework verbs and their test-id implications) to a code-repository entry point, which then orchestrates its own specialists internally.

---

## Skill philosophy

Skills are AI-assisted helpers, not gatekeepers. They reduce the cost of doing the right thing; they do not punish people for doing things their own way.

Inside a branch, before a PR is opened, every skill is invokable and ignorable. A Story author can ask `/spec-review` to critique their draft, or skip it. They can ask `/technical-spec-generate` to draft a tech-spec update in the affected code repo, or write it by hand. The skill provides suggestions and templates; it never blocks local work.

On the pull request, the rules change. The horizontal-role review skills — `/architect-review`, `/quality-control-review`, `/ux-review` — run automatically on every Story PR that touches their respective areas, and their comments are **blocking**. The Story author cannot merge while any of those comments are unresolved.

Resolution takes one of two forms. The first is **fix**: the author addresses the concern by changing the Story, the tests, or the implementation, and the skill is re-invoked (or the reviewer manually re-checks) and resolves. The second is **explicit acknowledgment**: the author writes into the PR a clear statement that the concern is read, the trade-off is understood, and the risk is accepted, with reasoning. Acknowledgments are durable artifacts — they are captured in the PR conversation and, when significant, in the commit message of the merged commit. They make the Owner's accountability visible to anyone reading the project's history later.

Silent dismissal is not a valid resolution. Marking a blocking comment "resolved" without addressing it — neither fixing nor acknowledging — is a process violation. CI checks and ai-review skills are configured to detect this pattern.

When a horizontal role believes that an Owner's acknowledgment underestimates a systemic risk, the open path is escalation to **constitution change**. The Architect (or QC, or UI/UX) opens a separate PR that proposes a new platform-wide rule. If accepted (and they hold final word over that document), subsequent Stories must comply with the new rule. This escalation route keeps horizontal authority real without trapping any single Story in indefinite debate.

Master-perimeter skills shipped with the canon. Each lists the specialists it typically invokes; "—" means the skill operates without specialist consultation.

| Skill | Purpose | Typically invokes |
|---|---|---|
| `/spec-brainstorm` | Help the Owner shape a Story from a brief: surface related Stories, propose personas, suggest applicable invariants, draft initial sections | `spec-spec`, optionally `architect-spec` and `ui-ux-spec` |
| `/spec-review` | Review a drafted user-spec for consistency with the existing product: does it conflict with established flows, does it drift from product-requirements, are there unstated assumptions | `spec-spec` |
| `/architect-review` | Architect's review of a Story: constitution cross-check, system-wide impact, tech-note proposals; runs automatically on every Story PR | `architect-spec` |
| `/quality-control-review` | Quality review of a Story: gate coverage, scenario strength, framework-vocabulary use; runs automatically on every Story PR | `quality-spec` |
| `/ux-review` | UX review of a Story: user-visible completeness, accessibility, copy; runs automatically on Stories that affect visible state | `ui-ux-spec` |
| `/scenario-generate` | Help draft commented-test scaffolds from the high-level goals in the user-spec; suggest edits to existing scenarios | `quality-spec` |
| `/technical-spec-generate` | Hand off Story context into a code repository to produce or update its tech specs | code-perimeter entry point of the affected repository |
| `/scenario-implement` | Fill executable code under existing scenario comments without removing them; extend the framework's PageObjects (or analogous helpers in other frameworks) with new verbs and their selectors when the scenario introduces actions the framework does not yet know | `quality-spec` plus code-perimeter specialists relevant to the surface being tested |
| `/implement` | Drive implementation in code repositories: hand off Story + tech spec + quality gates, let code-perimeter orchestrators take over | code-perimeter entry points of all affected repositories |
| `/rollout-help` | Prepare delivery packaging: PR labels, merge sequence, rollback plan, monitoring expectations | code-perimeter `sre` / `devops` specialists |
| `/post-delivery-review` | Scheduled drift check: compare merged Stories against current code behavior, flag divergence | `quality-spec` plus code-perimeter `evidence-collector` |
| `/decision-search` | Answer "why did we decide X?" by searching the git history of structured commit messages and decision tags | `decision-historian` |

Each skill has a clear role-aligned purpose and a narrowly defined output. A skill may legitimately invoke several specialists when the operation requires multiple domains (e.g., `/spec-brainstorm` may consult the spec specialist for product consistency and the architect specialist for applicable invariants in the same run). The skill, not the specialist, is responsible for the result. Composability comes from all of them reading and writing the same artifacts in their canonical shape.

---

## Brownfield adoption

The process is straightforward to apply on a greenfield project — clone the repository, rewrite root files, start a Story. Adopting it on an existing codebase with prior conventions, established roles, and a backlog of features without Story Specs is harder. This section describes how that adoption can happen without halting current development.

### Three parallel fronts

Brownfield adoption is not a sequenced migration; it is three workstreams running in parallel, regulated by capacity and priority:

**Forward write.** Every new feature from the moment of adoption goes through the full process: `/spec-brainstorm` → user-spec.md → commented tests → tech specs → implementation → PR with blocking ai-review. This is greenfield in a brownfield repo. Quality of process work is highest here because there is no legacy entanglement.

**Quiet catch-up.** What background capacity remains after forward write and ongoing maintenance goes into systematic backfill: extracting Story Specs from existing behavior, scaffolding scenarios, identifying invariants that should have been in the constitution. Non-blocking activity, prioritized from a coverage audit.

**Opportunistic catch-up via touch.** When anyone modifies legacy code for any reason — new feature, fix, refactor — the process asks: "this area is not yet under a Story; want to add a backfill while you're here?" Soft prompt, never blocking. Cumulative effect over time is large: touched code migrates automatically, with no separate capacity reservation needed.

These three fronts run simultaneously. The adopting team regulates the balance — typically forward gets the bulk of capacity, opportunistic catch-up is absorbed into normal feature work without dedicated time, and quiet catch-up takes whatever's left.

### Bootstrap path: three reversible phases

Before any of the three fronts can run, the canon has to land in the repo. This happens in three phases, each reversible:

**Phase 0 — Silent landing.** Place `process.md`, `constitution.md`, `templates/story/`, `.claude/skills/` and `.claude/agents/`, `.githooks/commit-msg` in the repository. Documentation and scaffolding only. No new CI workflows, no CODEOWNERS rules enforcing anything. Existing development continues unchanged. The team reads, discusses, optionally activates the commit-msg hook locally. Reversible by deletion.

**Phase 1 — Opt-in cycles.** Announce the first pilot Story under the new flow. Only that Story goes through the full process and lives under `stories/`. CI workflows run only on PRs touching `stories/` (path-filtered). The rest of the repo continues by its current conventions. Reversible by closing the pilot and removing the Story folder.

**Phase 2 — Enforcement expansion.** After two or three successful pilot Stories, evaluate what works and what changes. CODEOWNERS rules expand to new paths. A rule like "new features require a user-spec.md" is introduced. Old development gradually migrates through the opportunistic catch-up front. Reversible only at the cost of explicit rollback decisions; this is where adoption commits.

### Brownfield-specific skills

The standard master-perimeter skills handle forward write naturally. Catch-up has different shape and benefits from dedicated tooling:

| Skill | Purpose |
|---|---|
| `/backfill-story` | Reverse-engineers a draft user-spec from an existing code area, module, or endpoint by reading the code and current tests |
| `/legacy-test-convert` | Converts existing tests written in pre-canon style (raw selectors, sleep-based timing, internal-state peeking) into commented-test shape, extracting selectors into framework PageObjects |
| `/coverage-audit` | Scans the repo, identifies areas not yet under Story coverage, produces a prioritized backlog based on touch frequency, public-API surface, security exposure, and customer-facing visibility |
| `/legacy-decision-extract` | Reads git log over a long window, identifies behavior-changing commits made before the canon was adopted, suggests retroactive `decision/*` tags for the significant ones |

These are working tools, not blockers. An adopter who prefers to handle catch-up entirely by hand is not forced to use them.

**Touch-trigger as a CI bot, not a skill.** When a PR modifies a legacy area without an accompanying Story update, a soft bot comment surfaces: "this area is not yet under a Story (see `<area>`); want to add a backfill while you're here?" The author can dismiss with a label, run `/backfill-story` to do it inline, or commit to backfill in a follow-up PR. No blocking, no shaming — just a visible reminder.

### Interop: new touches old

While catch-up is in progress, new Stories will inevitably depend on legacy code paths that don't yet have their own Stories. Three common interop situations and how the canon handles them:

**A new scenario depends on legacy.** Story 1 uses `user.signsUpViaGitHub()`, which routes through an auth-service that hasn't been brought under a Story yet. The scenario works end-to-end and verifies real behavior, but the implicit dependency on the auth-service's quality is unstated. This is acceptable; the dependency is informational and listed in the new Story's `affects:` frontmatter. When the auth-service gets its catch-up Story, the dependency becomes formally tracked through `enforces:` and related-Story references.

**Behavior migration in progress.** Current behavior is X, target behavior is Y, the transition spans multiple PRs. The canon's rule — "a Story describes only current behavior" — still holds. While X is current, the Story describes X. The intent to reach Y lives in `ideas/`. When a PR shifts behavior to Y, the Story updates to describe Y in the same commit, and the structured commit message records why and what changed. There is never a Story that describes a state the system does not have.

**Legacy contradicts a new Story.** A new Story declares the system should do Y, but existing code currently does X. The Story can merge with its scenarios marked `test.todo` or `test.skip` and a note explaining the temporary gap; the implementation PR that closes the gap follows. The Owner explicitly acknowledges the temporary divergence in the merging commit's `Why:` section. This keeps merge velocity workable while keeping the divergence visible and time-bounded.

### Anti-patterns

- **Big-bang migration.** "Stop everything for a quarter, rewrite all features under the new process." This fails politically before it fails technically; team rejection rates are near 100%.
- **Force-converting existing tests up front.** Convert tests lazily, on touch, not as a separate project. The cost of pre-emptive conversion almost always exceeds the cost of having two test styles in the repo for a while.
- **Headcount rebalance before adoption is understood.** Do not restructure the team into Owner / Architect / Quality Gate Specialist positions until the team has run two or three Stories and understands what those roles actually do. Roles are responsibilities; positions can wait.
- **CODEOWNERS rewrite in Phase 0.** Adding required approvals before the team is familiar with the process produces blocked PRs and resentment. Wait until Phase 2.

---

## What this process is NOT

To prevent drift toward familiar models, several anti-patterns are explicit:

- **Not Jira-as-spec.** A Story is not a ticket. Stories live in git, evolve through commits, and always describe current behavior. There is no separate ticket queue describing the same work.
- **Not BDD with Gherkin.** Scenarios are first-class TypeScript living in test files. We do not maintain a parallel feature-file layer that has to be kept in sync with the executable layer.
- **Not test-after.** Acceptance criteria are written before or alongside implementation, as commented tests. Code is generated to satisfy them, not the other way around.
- **Not waterfall, despite the milestone names.** Stages cycle. Stage 4 review can redirect to Stage 3; implementation can expose gaps in scenarios. The process recognizes legitimate return points instead of pretending the flow is linear.
- **Not a generic abstraction.** The skill and sub-agent files in this repository are Claude Code format and intended for direct use. The methodology shape is vendor-neutral — adapting files to other AI tooling is a mechanical conversion — but this repository ships the Claude Code scaffold, not a tool-agnostic template.
- **Not headcount-prescriptive.** Roles are responsibilities. One person can hold six of them. A team of fifteen can split them across people. The process does not require any specific organizational chart.

---

## Open evolution

The process is intended to improve continuously, but improvement requires observability of its own behavior. Candidate metrics, to be defined and instrumented as the toolkit matures:

- Time from first commit on a Story branch to PR open (preparation cost)
- Time from PR open to merge (review cost)
- Number of CI-revert cycles per Story (assistance quality)
- Rate of ai-review blocking comments that turn out to be wrong (skill calibration)
- Number of Stories whose user-spec is amended after first merge (initial-specification quality)
- Frequency of decisions reversed (decision quality)

When friction emerges, it is fixed in process artifacts — the schema, the skill prompts, the CODEOWNERS map, this document — rather than absorbed as folklore. Process changes follow the same git workflow as Story changes: branch, PR, review, merge.

---

## Maintenance

This document is updated whenever a structural decision is made or revised. As with any other change to the repository, updates go through branch, PR, ai-review, and required approvals. Because `process.md` defines the canon that touches every role's area of final word, its CODEOWNERS line requires Owner, Architect, and Quality Gate Specialist approval at minimum. The PR workflow protects the canon from accidental drift; the commit-msg hook ensures the rationale for any change is captured in the structured commit message.

When a section of this document and observed practice diverge, the question to ask is not "is the practice wrong" but "is the document still describing what we want." Either the practice corrects to match the canon, or the canon corrects to match a better understanding. Both are valid; drift is not.
