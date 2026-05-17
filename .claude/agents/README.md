# Agents

Master-perimeter specialists — role-experts invoked by skills (or directly by humans) when judgment in a single domain is required. Each agent file follows the Claude Code sub-agent format: YAML frontmatter (`name`, `description`, `model`, `allowed-tools`) plus a Markdown body describing the role.

This directory also contains a **code-perimeter starter pack** — generic role definitions for a code repository, written stack-neutral with adopter customization hooks. The master-perimeter specialists above are also stack-neutral.

See [`../../process.md`](../../process.md) § Sub-agents as specialists for the operating model.

## Master-perimeter specialists

| Specialist | Domain |
|---|---|
| `spec-spec` | Story Spec format, product consistency, related Stories, existing flows, product-requirements alignment |
| `architect-spec` | Constitution rules, system-wide invariants, architectural baselines, technical standards |
| `quality-spec` | Quality gates, framework vocabulary, scenario coverage and strength, gate-to-test mapping |
| `ui-ux-spec` | User-visible completeness, accessibility, design-system alignment, copy and tone |
| `decision-historian` | Git history of structured commit decisions; answers "why was X decided?" by reading commit messages and tags |

These agents read `process.md`, `constitution.md`, the relevant user-specs, and framework vocabularies. They do not enter code repositories — the master perimeter never reaches down.

## Code-perimeter starter pack

A working set of code-perimeter agent roles, written generically. Each agent reads `AGENTS.md` and the governing spec docs at runtime, so most repo-specific tailoring happens by populating `AGENTS.md` rather than by editing the agent files. Adopt, adapt, or remove based on your stack and your specialist set.

### Primary entry points

- `engineering-lead.md`
- `senior-developer.md`
- `senior-project-manager.md`
- `qa-lead.md`

### Repo specialists

- `software-architect.md`
- `backend-architect.md`
- `frontend-developer.md`
- `devops-automator.md`
- `database-optimizer.md`
- `security-engineer.md`
- `sre.md`
- `technical-writer.md`
- `code-reviewer.md`

### QA specialists

- `accessibility-auditor.md`
- `api-tester.md`
- `evidence-collector.md`
- `performance-benchmarker.md`
- `reality-checker.md`
- `test-results-analyzer.md`

The companion code-perimeter skills (`check`, `eng-review`, `qa-review`) live under `../skills/` — workflow-style capabilities belong with the other skills, not here.
