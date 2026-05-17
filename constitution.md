# Constitution

Platform-wide invariants for this canon repository. Rules that hold for every change made to the AI-Native Software Delivery process, regardless of which file, contributor, or pull request introduces them. The constitution is read alongside `process.md`; where the process describes how delivery flows, this document describes what must remain true about the canon itself.

## 1. Methodology integrity

### 1.1 Current behavior only

Every descriptive artifact in this repository — `process.md`, templates, skill and sub-agent contracts, this constitution — describes the current shape of the process. Not historical iterations. Not roadmap intentions. Not parked ideas. History lives in git commit messages; ideas, if they appear at all, live in `ideas/` and are explicitly outside the process. A document that drifts into changelog or "resolved on" annotations corrupts the meaning of "the canon" and must be cleaned.

### 1.2 Vendor-honest scaffolding

Skills and sub-agents in this repository follow Claude Code format: frontmatter with `name`, `description`, `model`, `allowed-tools`, plus a Markdown body. The shape of the methodology is replicable in other AI environments, but this repository does not maintain a vendor-agnostic abstraction layer. Honest specificity is preferred to leaky abstraction; adopters using other AI tools convert mechanically rather than consume a pretend-portable shape.

### 1.3 Contracts stable, prompts evolve

The contract of any skill or sub-agent — its documented Reads, Produces, Invokes, and Mode — is the part that must remain stable across revisions. The prompt body that drives AI behavior is allowed and expected to evolve through use. Changing a contract is a structural change and goes through the full PR + structured commit + required approvals workflow. Refining a prompt is a normal contribution.

## 2. Decision capture

### 2.1 Decisions live in commits

Every behavioral change is captured in a structured git commit message — `Why`, `Considered`, `Chose`, `Affects` — enforced by the `.githooks/commit-msg` hook. No artifact in this repository contains a changelog, version-history block, or "resolved on" annotation. If a question existed during drafting and has since been answered, the answer is reflected in current behavior and the trace is in the commit that answered it.

### 2.2 The process applies to its own evolution

Changes to this repository — including changes to this constitution — go through the same workflow the canon prescribes for any project: branch, PR, ai-review, required CODEOWNERS approvals (Owner + Architect + Quality Gate Specialist for `process.md` and `constitution.md`), merge. The canon never bypasses itself.

## 3. Perimeter discipline

### 3.1 Master never reaches down

This repository defines the master perimeter. It carries no operational reach into code repositories an adopting project may have. References that appear in master-perimeter examples (`affects: apps/web`, "this Story touches service X") are informational pointers only. Skills and sub-agents shipped here never inspect, query, or coordinate with code-repository internals; that is the code perimeter's job, governed by its own Code Owners.

## 4. Adoption commitments

### 4.1 No attribution required

The repository is released under MIT No Attribution. Forks, vendored copies, and commercial use require no credit and no permission. Attribution is appreciated but never demanded by the canon itself; any pressure to credit is contributor convention, not canon rule.

### 4.2 Clone-and-go is the target shape

The repository is structured so that an adopter clones it, rewrites this constitution and a high-level project description, and is ready to apply the process. Generic abstractions, tool-agnostic indirections, or "starter packs you have to assemble" that require significant adaptation work before the process is operational are out of scope. When a contribution adds friction to first-clone use without paying for itself in capability, the friction loses.
