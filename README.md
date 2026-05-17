# AI-Native Software Delivery Process

> A process for shipping software when AI generates most of the implementation and humans own intent, validation, and behavioral guarantees.

This repository defines a software delivery process designed for the AI-native era from the ground up — not retrofitted onto traditional roles or workflows. It is meant to be **adoptable in any project** that wants to put intent, executable acceptance, and platform-wide invariants ahead of hand-crafted implementation as the primary site of human attention.

The canonical methodology lives in [`process.md`](./process.md). This README is the entry point — it tells you what's here and how to use it.

---

## The problem

AI now generates a meaningful share of implementation, and the share keeps growing. Teams have less direct authorship over the code they ship. The question stops being "is this code well-written?" and becomes "does this code do what we said it should do?" — and the systems most engineering teams use today were designed for a world where humans wrote everything by hand.

Story trackers describe intent that drifts from implementation. BDD frameworks duplicate scenarios in prose and code that go out of sync. Decision history lives in chat threads and old tickets. There is no executable through-line from customer intent to the code that satisfies it — so when something breaks, nobody can quickly answer "what did we agree this should do, and where is that agreement enforced?"

This process is built around that through-line.

---

## What this is

A delivery process built around four observations about how software is increasingly produced:

- AI generates implementation reliably enough that human time is better spent elsewhere.
- Humans inspect generated code less deeply over time, whether we want them to or not.
- Behavioral guarantees and executable acceptance must therefore become the central control system.
- Specifications stop being documents and start being living, version-controlled, machine-verifiable artifacts.

From those, the process derives a small set of structural commitments:

- **Stories** are folders, not tickets, and describe only current behavior.
- **Acceptance criteria** live as commented executable tests, never as duplicated prose.
- **Decision history** lives in structured git commit messages — addressable, searchable, never inside spec changelogs.
- **State** is computed from git (branches + PRs + CI), never from a status field.
- **Master perimeter** (Stories, frameworks, constitution) sits above **code perimeter** (implementation, tech specs) with asymmetric awareness.
- **Skills** are AI-assisted helpers; **sub-agents** are role-specialists; **horizontal-role reviews** are mandatory and blocking on merge but resolvable through explicit acknowledgment.

The full reasoning, role boundaries, artifact ontology, and gating mechanics are in [`process.md`](./process.md).

---

## What this is not

- **Not Jira-as-spec.** Stories live in git, not in a parallel ticket queue. There is one source of truth, not two.
- **Not BDD with Gherkin.** Scenarios are first-class TypeScript inside test files, not a separate feature-file layer that must be kept in sync.
- **Not test-after.** Acceptance criteria are written before or alongside implementation, as commented executable tests. Code is generated to satisfy them, not the other way around.
- **Not vendor-locked.** The methodology shape is replicable in any AI environment; this repository ships the Claude Code incarnation as a working starting point.
- **Not headcount-prescriptive.** Roles are responsibilities, not positions. In a one-person project, one human holds all six roles and switches modes consciously. In a fifteen-person team, roles split across people without the structure changing.

Full reasoning in [`process.md`](./process.md) § What this process is NOT.

---

## What's in this repository

```
ai-software-process/
├── README.md                ← you are here (rewrite for your project after cloning)
├── CLAUDE.md                ← AI agent's working guide (rewrite for your project)
├── process.md               ← the canon: full methodology, mandatory reading
├── constitution.md          ← platform invariants (rewrite for your project)
├── CONTRIBUTING.md          ← contribution guide (rewrite or remove if not open)
├── LICENSE                  ← MIT No Attribution
├── .gitignore
├── templates/               ← per-Story scaffolds skills consume when creating new artifacts
│   └── story/                       user-spec + e2e scenario starting shapes + JSON schema
├── .claude/
│   ├── skills/              ← Claude Code skills — master-perimeter workflows + code-perimeter pack
│   └── agents/              ← Claude Code sub-agents — master-perimeter specialists + code-perimeter pack
├── .githooks/
│   └── commit-msg           ← active commit format enforcement (local)
└── .github/
    ├── CODEOWNERS           ← areas of final word (rewrite handles for your project)
    └── workflows/           ← PR-side enforcement
        ├── commit-format.yml      structured commit format on every PR commit
        ├── spec-validation.yml    user-spec.md frontmatter against JSON schema
        └── ai-review.yml          horizontal-role review skills on every Story PR
```

This repository is a **clone-and-go Claude Code toolkit**. `.claude/skills/` and `.claude/agents/` contain both the master-perimeter workflows (`spec-brainstorm`, `architect-review`, `scenario-implement`, etc. plus their consulting specialists) and a generic code-perimeter starter pack (engineering and QA agents written stack-neutral, reading `AGENTS.md` at runtime so most adoption happens by populating that file). Fork the repository, write your `constitution.md`, point the code-perimeter pack at your `AGENTS.md`, and you are ready to apply the process.

Adapting these files to another AI tool is a mechanical conversion; the process shape itself does not depend on Claude Code.

### A Story, concretely

A Story is a folder. Inside, the user-spec describes the goal and the personas; the scenarios under `e2e/` (and `perf/`, `security/`, `a11y/` when applicable) verify it. A scenario looks like this:

```ts
test('User signs up via GitHub for the first time', async ({ user }) => {
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

The Owner reads the comments as acceptance criteria. The Quality Gate Specialist reads code and comments together. Drift between described behavior and verified behavior is physically impossible — they share a file and appear in the same diff. Selectors, sleeps, and implementation details live inside the framework's PageObjects, not the test body — that's the bilateral contract between scenarios and the code that satisfies them.

---

## How to apply this process to a project

The process assumes a **master repository** (where Stories, frameworks, and constitution live) and optionally one or more **code repositories** (where implementation, tech specs, and code review live). In small projects both perimeters can coexist in the same physical repo.

Adoption looks like this — clone the repo and edit in place:

1. **Read [`process.md`](./process.md)** end to end. It is not long and there is no shortcut for understanding the structure.
2. **Clone or fork this repository** into the location that will be your project's master repository.
3. **Rewrite [`constitution.md`](./constitution.md)** with the platform-wide invariants that hold for your project (this repo's constitution is about the canon itself, not about a product).
4. **Rewrite [`README.md`](./README.md) and [`CLAUDE.md`](./CLAUDE.md)** with a high-level description of your project. The originals describe the canon; replace them with your project's context.
5. **Rewrite [`.github/CODEOWNERS`](./.github/CODEOWNERS)** — replace the placeholder handle with the GitHub teams or users who hold each area of final word.
6. **Activate the commit-msg hook** locally: `git config core.hooksPath .githooks`. The hook is already in place at `.githooks/commit-msg`.
7. **Create `stories/`** in the master repo. Skills use `templates/story/` automatically when scaffolding new Stories.
8. **Review `.claude/skills/` and `.claude/agents/`** — keep what fits your stack, remove or rewrite the code-perimeter pack to match your codebase.
9. **Configure GitHub for PR enforcement.** Set the `ANTHROPIC_API_KEY` repository secret used by `.github/workflows/ai-review.yml`. Enable branch protection on `main`: require CODEOWNERS approvals, and require all three workflows (`commit-format`, `spec-validation`, `ai-review`) to be green before merge.
10. **Pick a pilot Story** and walk through the full cycle once, end to end, before scaling adoption.

This repository ships the Claude Code incarnation of the process — skills and sub-agents are in `.claude/` format and intended for direct use. The shape itself is replicable in any AI-assisted environment given equivalent primitives.

---

## Evolving the process

The process is designed to evolve through real use. When friction emerges, the canon corrects to match the better understanding, never the other way around. Feedback, forks, and pull requests are welcome — see [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the contribution workflow (the same one the canon prescribes for any project, applied to its own evolution).

---

## License

Released under the [MIT No Attribution](./LICENSE) license. Fork, modify, vendor, embed in commercial products — no permission needed and no obligation to credit.

Attribution back to this repository or to the author ([Vladimir Panov](https://dev.to/vladimirpanov)) is appreciated but **not required**.
