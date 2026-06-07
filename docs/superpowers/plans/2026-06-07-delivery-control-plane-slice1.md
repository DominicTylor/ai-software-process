# Delivery Control Plane — Slice 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local, read-only delivery control plane that reads the master repo's git + files and renders each change vector (branch) with its canonical state and derived readiness signals.

**Architecture:** Pure state engine (`cp-core`) consumes normalized facts produced by IO adapters (`cp-git`, `cp-spec`). A Fastify app (`cp-server`) exposes them over a JSON API and serves a Vite/React/shadcn SPA (`cp-web`). All state is derived from git + artifacts — no status files. Forge (PR/CI) and execution facts are out of scope for this slice and surfaced as `unknown`.

**Tech Stack:** pnpm 11 workspaces, Node ≥24, TypeScript 6 (ESM, `moduleResolution: Bundler`), Vitest, simple-git, gray-matter + ajv, picomatch, Fastify + @fastify/static + socket.io, Vite + React + shadcn/ui + Tailwind, k6 (perf framework skeleton only).

---

## Working environment

All work happens **inside the forked `ai-software-process` monorepo** (the user owns `DominicTylor/ai-software-process`). The repo already contains: `pnpm-workspace.yaml` (globs `frameworks/*`, `demo`), `tsconfig.base.json`, root `package.json` (`@canon/*` naming, `type: module`, Node ≥24, pnpm 11.1.2), and `frameworks/e2e` (`@canon/e2e-framework`, Playwright).

All paths below are **relative to the monorepo root**. Copy the spec and this plan into the repo's `docs/superpowers/` before starting so they travel with the code.

## Shared type contracts (defined in Task 2, referenced everywhere)

These names are fixed for the whole plan; do not rename them in later tasks.

```ts
export type GateKind = 'e2e' | 'perf' | 'security' | 'a11y';
export type ScenarioState = 'scaffold' | 'implemented';
export type GateState = 'missing' | 'scaffold' | 'implemented';
export type VectorState = 'private-wip' | 'live' | 'under-review' | 'ready-to-merge';

export interface ScenarioFile {
  path: string;            // repo-relative
  kind: GateKind;
  state: ScenarioState;
  todoCount: number;       // test.todo + test.skip
  implementedCount: number; // test(...)
}
export interface GateReadiness { kind: GateKind; state: GateState; }
export interface StoryFacts {
  slug: string;
  dir: string;             // stories/<grouping>/<slug>
  specPresent: boolean;
  specValid: boolean | null; // null when no spec
  specErrors: string[];
  scenarios: ScenarioFile[];
}
export interface BehavioralCommit {
  sha: string; subject: string; wellFormed: boolean; missingSections: string[];
}
export interface BranchFacts {
  branch: string;
  merged: boolean;            // merged into main
  diffPaths: string[];        // repo-relative paths changed vs main
  behavioralCommits: BehavioralCommit[];
  frameworksTouched: boolean;
  constitutionTouched: boolean;
}
export interface NextAction { kind: string; label: string; reason: string; }
export interface StoryReadiness extends StoryFacts { gates: GateReadiness[]; }
export interface Vector {
  branch: string;
  state: VectorState;
  merged: boolean;
  stories: StoryReadiness[];
  frameworksTouched: boolean;
  constitutionTouched: boolean;
  behavioralCommits: BehavioralCommit[];
  candidateOwners: string[];
  nextAction: NextAction;
  forge: { prState: 'unknown'; ci: 'unknown'; approvals: 'unknown' };
}
```

---

## Task 1: Monorepo bootstrap for control-plane packages

**Files:**
- Modify: `pnpm-workspace.yaml`
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `tsconfig.json`

- [ ] **Step 1: Add workspace globs**

Replace `pnpm-workspace.yaml` with:

```yaml
packages:
  - 'frameworks/*'
  - 'demo'
  - 'packages/*'
  - 'apps/*'
```

- [ ] **Step 2: Add root scripts and dev dependencies**

Edit `package.json` — add these scripts to `scripts` and add `devDependencies`:

```json
{
  "scripts": {
    "test:e2e": "pnpm --filter @canon/e2e-framework test",
    "test:e2e:ui": "pnpm --filter @canon/e2e-framework test:ui",
    "install:browsers": "pnpm --filter @canon/e2e-framework install:browsers",
    "typecheck": "tsc -b",
    "test": "vitest run",
    "test:watch": "vitest",
    "cp:dev": "pnpm --filter @canon/cp-web dev",
    "cp:server": "pnpm --filter @canon/cp-server dev",
    "cp:build": "pnpm --filter @canon/cp-web build && pnpm --filter @canon/cp-server build"
  },
  "devDependencies": {
    "@canon/e2e-framework": "workspace:*",
    "typescript": "6.0.3",
    "vitest": "2.1.8",
    "@types/node": "24.12.4"
  }
}
```

- [ ] **Step 3: Add root Vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/**/*.test.ts', 'apps/**/*.test.ts'],
    environment: 'node',
  },
});
```

- [ ] **Step 4: Add root solution tsconfig**

Create `tsconfig.json`:

```json
{
  "files": [],
  "references": [
    { "path": "packages/cp-contracts" },
    { "path": "packages/cp-spec" },
    { "path": "packages/cp-git" },
    { "path": "packages/cp-core" },
    { "path": "apps/cp-server" }
  ]
}
```

- [ ] **Step 5: Install and verify**

Run: `pnpm install`
Expected: install succeeds (references resolve after later tasks create the packages; this step only needs `pnpm install` to complete).

- [ ] **Step 6: Commit**

```bash
git add pnpm-workspace.yaml package.json vitest.config.ts tsconfig.json
git commit -m "chore: bootstrap control-plane workspace (vitest, tsconfig, globs)"
```

---

## Task 2: cp-contracts package (shared types)

**Files:**
- Create: `packages/cp-contracts/package.json`
- Create: `packages/cp-contracts/tsconfig.json`
- Create: `packages/cp-contracts/src/index.ts`

- [ ] **Step 1: Create package manifest**

Create `packages/cp-contracts/package.json`:

```json
{
  "name": "@canon/cp-contracts",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "scripts": { "typecheck": "tsc --noEmit" },
  "devDependencies": { "typescript": "6.0.3" }
}
```

- [ ] **Step 2: Create package tsconfig**

Create `packages/cp-contracts/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "composite": true, "rootDir": "src", "outDir": "dist" },
  "include": ["src"]
}
```

- [ ] **Step 3: Write the types**

Create `packages/cp-contracts/src/index.ts` with exactly the contracts block from the "Shared type contracts" section above (copy it verbatim).

- [ ] **Step 4: Verify it typechecks**

Run: `pnpm --filter @canon/cp-contracts typecheck`
Expected: PASS (no output, exit 0).

- [ ] **Step 5: Commit**

```bash
git add packages/cp-contracts
git commit -m "feat(cp-contracts): shared delivery-control-plane types"
```

---

## Task 3: cp-spec — frontmatter parse + schema validation

**Files:**
- Create: `packages/cp-spec/package.json`
- Create: `packages/cp-spec/tsconfig.json`
- Create: `packages/cp-spec/src/spec.ts`
- Test: `packages/cp-spec/src/spec.test.ts`

- [ ] **Step 1: Create package manifest**

Create `packages/cp-spec/package.json`:

```json
{
  "name": "@canon/cp-spec",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "scripts": { "typecheck": "tsc --noEmit" },
  "dependencies": {
    "@canon/cp-contracts": "workspace:*",
    "ajv": "8.17.1",
    "gray-matter": "4.0.3",
    "picomatch": "4.0.2"
  },
  "devDependencies": { "typescript": "6.0.3", "@types/picomatch": "3.0.2" }
}
```

- [ ] **Step 2: Create package tsconfig**

Create `packages/cp-spec/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "composite": true, "rootDir": "src", "outDir": "dist" },
  "references": [{ "path": "../cp-contracts" }],
  "include": ["src"]
}
```

- [ ] **Step 3: Install deps**

Run: `pnpm install`
Expected: ajv, gray-matter, picomatch installed.

- [ ] **Step 4: Write the failing test**

Create `packages/cp-spec/src/spec.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { validateUserSpec } from './spec';

const SCHEMA = {
  type: 'object',
  required: ['title', 'slug'],
  additionalProperties: false,
  properties: {
    title: { type: 'string', minLength: 3 },
    slug: { type: 'string', pattern: '^[a-z0-9]+(-[a-z0-9]+)*$' },
    enforces: { type: 'array', items: { type: 'string' } },
    affects: { type: 'array', items: { type: 'string' } },
  },
};

describe('validateUserSpec', () => {
  it('accepts a well-formed user-spec', () => {
    const md = '---\ntitle: User signs in\nslug: login\n---\n# body';
    const r = validateUserSpec(md, SCHEMA);
    expect(r.valid).toBe(true);
    expect(r.errors).toEqual([]);
  });

  it('reports missing required fields', () => {
    const md = '---\ntitle: x\n---\n# body';
    const r = validateUserSpec(md, SCHEMA);
    expect(r.valid).toBe(false);
    expect(r.errors.join(' ')).toContain('slug');
  });

  it('flags absent frontmatter', () => {
    const r = validateUserSpec('# no frontmatter', SCHEMA);
    expect(r.valid).toBe(false);
    expect(r.errors.join(' ').toLowerCase()).toContain('frontmatter');
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `pnpm vitest run packages/cp-spec/src/spec.test.ts`
Expected: FAIL — `validateUserSpec` not exported.

- [ ] **Step 6: Write minimal implementation**

Create `packages/cp-spec/src/spec.ts`:

```ts
import matter from 'gray-matter';
import { Ajv, type Schema } from 'ajv';

export interface SpecValidation { valid: boolean; errors: string[]; }

export function validateUserSpec(markdown: string, schema: Schema): SpecValidation {
  const parsed = matter(markdown);
  if (parsed.matter.trim() === '') {
    return { valid: false, errors: ['no YAML frontmatter found'] };
  }
  const ajv = new Ajv({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);
  const ok = validate(parsed.data);
  if (ok) return { valid: true, errors: [] };
  const errors = (validate.errors ?? []).map(
    (e) => `${e.instancePath || '/'} ${e.message ?? ''}`.trim() +
      (e.params && 'missingProperty' in e.params ? ` (${e.params.missingProperty})` : ''),
  );
  return { valid: false, errors };
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `pnpm vitest run packages/cp-spec/src/spec.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 8: Commit**

```bash
git add packages/cp-spec
git commit -m "feat(cp-spec): validate user-spec frontmatter against schema"
```

---

## Task 4: cp-spec — gate detection + scaffold/implemented parsing

**Files:**
- Create: `packages/cp-spec/src/scenarios.ts`
- Test: `packages/cp-spec/src/scenarios.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/cp-spec/src/scenarios.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { gateKindForPath, parseScenarioSource } from './scenarios';

describe('gateKindForPath', () => {
  it('maps gate folders to kinds', () => {
    expect(gateKindForPath('stories/auth/login/e2e/signs-in.spec.ts')).toBe('e2e');
    expect(gateKindForPath('stories/auth/login/perf/latency.k6.ts')).toBe('perf');
    expect(gateKindForPath('stories/auth/login/security/x.spec.ts')).toBe('security');
    expect(gateKindForPath('stories/auth/login/a11y/x.spec.ts')).toBe('a11y');
  });
  it('returns null for non-scenario paths', () => {
    expect(gateKindForPath('stories/auth/login/user-spec.md')).toBeNull();
    expect(gateKindForPath('frameworks/e2e/index.ts')).toBeNull();
  });
});

describe('parseScenarioSource', () => {
  it('counts implemented vs scaffold and reports state', () => {
    const src = [
      "test('a', async () => {});",
      "test.todo('b', async () => {});",
      "test.skip('c', async () => {});",
    ].join('\n');
    const r = parseScenarioSource(src);
    expect(r.implementedCount).toBe(1);
    expect(r.todoCount).toBe(2);
    expect(r.state).toBe('implemented'); // at least one real test
  });
  it('is scaffold when only todo/skip present', () => {
    const r = parseScenarioSource("test.todo('b', async () => {});");
    expect(r.implementedCount).toBe(0);
    expect(r.state).toBe('scaffold');
  });
  it('ignores test.describe and commented-out tests', () => {
    const src = [
      "test.describe('group', () => {",
      "  // test('old', () => {});",
      "  test.todo('pending');",
      "});",
    ].join('\n');
    const r = parseScenarioSource(src);
    expect(r.implementedCount).toBe(0);
    expect(r.todoCount).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run packages/cp-spec/src/scenarios.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

Create `packages/cp-spec/src/scenarios.ts`:

```ts
import type { GateKind, ScenarioState } from '@canon/cp-contracts';

const GATE_DIRS: GateKind[] = ['e2e', 'perf', 'security', 'a11y'];

export function gateKindForPath(path: string): GateKind | null {
  const parts = path.split('/');
  for (const kind of GATE_DIRS) {
    const i = parts.indexOf(kind);
    if (i !== -1 && i < parts.length - 1) return kind;
  }
  return null;
}

export interface ScenarioParse {
  implementedCount: number;
  todoCount: number;
  state: ScenarioState;
}

export function parseScenarioSource(source: string): ScenarioParse {
  // Strip line comments so commented-out tests don't count.
  const code = source.replace(/\/\/.*$/gm, '');
  const todoCount = (code.match(/\btest\.(todo|skip)\s*\(/g) ?? []).length;
  // `test(` but not `test.todo(`, `test.skip(`, `test.describe(`, etc.
  const implementedCount = (code.match(/\btest\s*\(/g) ?? []).length;
  return {
    implementedCount,
    todoCount,
    state: implementedCount > 0 ? 'implemented' : 'scaffold',
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run packages/cp-spec/src/scenarios.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/cp-spec/src/scenarios.ts packages/cp-spec/src/scenarios.test.ts
git commit -m "feat(cp-spec): detect gate kind and scaffold-vs-implemented scenarios"
```

---

## Task 5: cp-spec — CODEOWNERS parser

**Files:**
- Create: `packages/cp-spec/src/codeowners.ts`
- Test: `packages/cp-spec/src/codeowners.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/cp-spec/src/codeowners.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { parseCodeowners, ownersForPaths } from './codeowners';

const FILE = [
  '# comment',
  '/stories/                   @owner @qa',
  '/constitution.md            @arch',
  '/frameworks/                @qa',
].join('\n');

describe('codeowners', () => {
  it('parses rules in order', () => {
    const rules = parseCodeowners(FILE);
    expect(rules).toHaveLength(3);
    expect(rules[0]!.owners).toEqual(['@owner', '@qa']);
  });
  it('resolves owners by last matching rule per path, unioned across paths', () => {
    const rules = parseCodeowners(FILE);
    const owners = ownersForPaths(
      ['stories/auth/login/user-spec.md', 'constitution.md'],
      rules,
    );
    expect(owners.sort()).toEqual(['@arch', '@owner', '@qa'].sort());
  });
  it('returns empty when no rule matches', () => {
    const rules = parseCodeowners(FILE);
    expect(ownersForPaths(['README.md'], rules)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run packages/cp-spec/src/codeowners.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

Create `packages/cp-spec/src/codeowners.ts`:

```ts
import picomatch from 'picomatch';

export interface OwnerRule { pattern: string; owners: string[]; match: (p: string) => boolean; }

function toGlob(pattern: string): string {
  // CODEOWNERS: leading '/' anchors at root; trailing '/' means a directory subtree.
  let p = pattern;
  if (p.startsWith('/')) p = p.slice(1);
  if (p.endsWith('/')) p = `${p}**`;
  return p;
}

export function parseCodeowners(text: string): OwnerRule[] {
  const rules: OwnerRule[] = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (line === '' || line.startsWith('#')) continue;
    const [pattern, ...owners] = line.split(/\s+/);
    if (!pattern || owners.length === 0) continue;
    const glob = toGlob(pattern);
    const isMatch = picomatch(glob, { dot: true });
    rules.push({ pattern, owners, match: (p) => isMatch(p) });
  }
  return rules;
}

export function ownersForPaths(paths: string[], rules: OwnerRule[]): string[] {
  const set = new Set<string>();
  for (const path of paths) {
    // Last matching rule wins (CODEOWNERS semantics).
    for (let i = rules.length - 1; i >= 0; i--) {
      if (rules[i]!.match(path)) {
        for (const o of rules[i]!.owners) set.add(o);
        break;
      }
    }
  }
  return [...set];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run packages/cp-spec/src/codeowners.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Create the package barrel and verify typecheck**

Create `packages/cp-spec/src/index.ts`:

```ts
export { validateUserSpec, type SpecValidation } from './spec';
export { gateKindForPath, parseScenarioSource, type ScenarioParse } from './scenarios';
export { parseCodeowners, ownersForPaths, type OwnerRule } from './codeowners';
```

Run: `pnpm --filter @canon/cp-spec typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/cp-spec/src/codeowners.ts packages/cp-spec/src/codeowners.test.ts packages/cp-spec/src/index.ts
git commit -m "feat(cp-spec): CODEOWNERS parser and barrel export"
```

---

## Task 6: cp-git — git reader against a fixture repo

**Files:**
- Create: `packages/cp-git/package.json`
- Create: `packages/cp-git/tsconfig.json`
- Create: `packages/cp-git/src/index.ts`
- Test: `packages/cp-git/src/git.test.ts`

- [ ] **Step 1: Create package manifest**

Create `packages/cp-git/package.json`:

```json
{
  "name": "@canon/cp-git",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "scripts": { "typecheck": "tsc --noEmit" },
  "dependencies": { "@canon/cp-contracts": "workspace:*", "simple-git": "3.27.0" },
  "devDependencies": { "typescript": "6.0.3", "@types/node": "24.12.4" }
}
```

- [ ] **Step 2: Create package tsconfig**

Create `packages/cp-git/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "composite": true, "rootDir": "src", "outDir": "dist" },
  "references": [{ "path": "../cp-contracts" }],
  "include": ["src"]
}
```

- [ ] **Step 3: Install deps**

Run: `pnpm install`
Expected: simple-git installed.

- [ ] **Step 4: Write the failing test**

Create `packages/cp-git/src/git.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { simpleGit } from 'simple-git';
import { readRepo } from './index';

let dir: string;

beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), 'cp-git-'));
  const g = simpleGit(dir);
  await g.init(['-b', 'main']);
  await g.addConfig('user.email', 't@t.t');
  await g.addConfig('user.name', 'T');
  writeFileSync(join(dir, 'README.md'), '# root\n');
  await g.add('.'); await g.commit('chore: init');

  await g.checkoutLocalBranch('feature');
  mkdirSync(join(dir, 'stories/auth/login/e2e'), { recursive: true });
  writeFileSync(join(dir, 'stories/auth/login/user-spec.md'), '---\ntitle: x\nslug: login\n---\n');
  writeFileSync(join(dir, 'stories/auth/login/e2e/s.spec.ts'), "test('a', () => {});\n");
  await g.add('.');
  await g.commit('behavior: add login\n\nWhy: x\nConsidered: a, b\nChose: a\nAffects: stories/auth/login/');
  await g.checkout('main');
});

afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe('readRepo', () => {
  it('lists branches and marks unmerged feature', async () => {
    const repo = await readRepo(dir, 'main');
    const feature = repo.branches.find((b) => b.branch === 'feature');
    expect(feature).toBeDefined();
    expect(feature!.merged).toBe(false);
  });
  it('collects diff paths and a well-formed behavioral commit', async () => {
    const repo = await readRepo(dir, 'main');
    const feature = repo.branches.find((b) => b.branch === 'feature')!;
    expect(feature.diffPaths).toContain('stories/auth/login/user-spec.md');
    expect(feature.behavioralCommits[0]!.wellFormed).toBe(true);
  });
  it('reads file content at a ref', async () => {
    const repo = await readRepo(dir, 'main');
    const content = await repo.readFileAtRef('feature', 'stories/auth/login/user-spec.md');
    expect(content).toContain('slug: login');
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `pnpm vitest run packages/cp-git/src/git.test.ts`
Expected: FAIL — `readRepo` not exported.

- [ ] **Step 6: Write minimal implementation**

Create `packages/cp-git/src/index.ts`:

```ts
import { simpleGit, type SimpleGit } from 'simple-git';
import type { BranchFacts, BehavioralCommit } from '@canon/cp-contracts';

const REQUIRED_SECTIONS = ['Why:', 'Considered:', 'Chose:', 'Affects:'];

export interface RepoReader {
  branches: BranchFacts[];
  readFileAtRef(ref: string, path: string): Promise<string | null>;
}

function parseBehavioral(sha: string, message: string): BehavioralCommit | null {
  const subject = message.split('\n')[0] ?? '';
  if (!subject.startsWith('behavior:')) return null;
  const missing = REQUIRED_SECTIONS.filter((s) => !message.includes(s));
  return { sha, subject, wellFormed: missing.length === 0, missingSections: missing };
}

async function branchFacts(g: SimpleGit, branch: string, main: string): Promise<BranchFacts> {
  const mergedList = await g.raw(['branch', '--merged', main, '--format=%(refname:short)']);
  const merged = mergedList.split('\n').map((s) => s.trim()).includes(branch);

  const diff = branch === main
    ? ''
    : await g.raw(['diff', '--name-only', `${main}...${branch}`]);
  const diffPaths = diff.split('\n').map((s) => s.trim()).filter(Boolean);

  const log = branch === main
    ? { all: [] as { hash: string; message: string; body: string }[] }
    : await g.log({ from: main, to: branch, format: { hash: '%H', message: '%s', body: '%b' } });
  const behavioralCommits = log.all
    .map((c) => parseBehavioral(c.hash, `${c.message}\n\n${c.body}`))
    .filter((c): c is BehavioralCommit => c !== null);

  return {
    branch,
    merged,
    diffPaths,
    behavioralCommits,
    frameworksTouched: diffPaths.some((p) => p.startsWith('frameworks/')),
    constitutionTouched: diffPaths.includes('constitution.md'),
  };
}

export async function readRepo(repoPath: string, main = 'main'): Promise<RepoReader> {
  const g = simpleGit(repoPath);
  const summary = await g.branchLocal();
  const names = summary.all.filter((n) => n !== main);
  const branches = await Promise.all(names.map((n) => branchFacts(g, n, main)));
  return {
    branches,
    async readFileAtRef(ref, path) {
      try {
        return await g.show([`${ref}:${path}`]);
      } catch {
        return null;
      }
    },
  };
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `pnpm vitest run packages/cp-git/src/git.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 8: Commit**

```bash
git add packages/cp-git
git commit -m "feat(cp-git): read branches, diffs, behavioral commits, file-at-ref"
```

---

## Task 7: cp-core — pure state engine

**Files:**
- Create: `packages/cp-core/package.json`
- Create: `packages/cp-core/tsconfig.json`
- Create: `packages/cp-core/src/index.ts`
- Test: `packages/cp-core/src/core.test.ts`

- [ ] **Step 1: Create package manifest**

Create `packages/cp-core/package.json`:

```json
{
  "name": "@canon/cp-core",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "scripts": { "typecheck": "tsc --noEmit" },
  "dependencies": { "@canon/cp-contracts": "workspace:*" },
  "devDependencies": { "typescript": "6.0.3" }
}
```

- [ ] **Step 2: Create package tsconfig**

Create `packages/cp-core/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "composite": true, "rootDir": "src", "outDir": "dist" },
  "references": [{ "path": "../cp-contracts" }],
  "include": ["src"]
}
```

- [ ] **Step 3: Write the failing test**

Create `packages/cp-core/src/core.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { computeStoryGates, computeVector } from './index';
import type { BranchFacts, StoryFacts } from '@canon/cp-contracts';

function story(over: Partial<StoryFacts> = {}): StoryFacts {
  return {
    slug: 'login', dir: 'stories/auth/login',
    specPresent: true, specValid: true, specErrors: [],
    scenarios: [
      { path: 'stories/auth/login/e2e/s.spec.ts', kind: 'e2e', state: 'implemented', todoCount: 0, implementedCount: 1 },
    ],
    ...over,
  };
}
function branch(over: Partial<BranchFacts> = {}): BranchFacts {
  return {
    branch: 'feature', merged: false, diffPaths: [],
    behavioralCommits: [], frameworksTouched: false, constitutionTouched: false,
    ...over,
  };
}

describe('computeStoryGates', () => {
  it('reports e2e implemented and perf missing', () => {
    const gates = computeStoryGates(story());
    expect(gates.find((g) => g.kind === 'e2e')!.state).toBe('implemented');
    expect(gates.find((g) => g.kind === 'perf')!.state).toBe('missing');
  });
  it('reports scaffold when only todo scenarios', () => {
    const s = story({ scenarios: [
      { path: 'p', kind: 'e2e', state: 'scaffold', todoCount: 1, implementedCount: 0 },
    ]});
    expect(computeStoryGates(s).find((g) => g.kind === 'e2e')!.state).toBe('scaffold');
  });
});

describe('computeVector', () => {
  it('merged branch is live with next-action none', () => {
    const v = computeVector(branch({ merged: true }), [story()], []);
    expect(v.state).toBe('live');
    expect(v.nextAction.kind).toBe('none');
    expect(v.forge.prState).toBe('unknown');
  });
  it('unmerged ready branch suggests open-pr', () => {
    const v = computeVector(branch(), [story()], []);
    expect(v.state).toBe('private-wip');
    expect(v.nextAction.kind).toBe('open-pr');
  });
  it('invalid spec takes priority', () => {
    const v = computeVector(branch(), [story({ specValid: false, specErrors: ['x'] })], []);
    expect(v.nextAction.kind).toBe('fix-spec');
  });
  it('missing e2e suggests add-e2e', () => {
    const v = computeVector(branch(), [story({ scenarios: [] })], []);
    expect(v.nextAction.kind).toBe('add-e2e');
  });
  it('scaffold scenarios suggest implement-scenarios', () => {
    const v = computeVector(branch(), [story({ scenarios: [
      { path: 'p', kind: 'e2e', state: 'scaffold', todoCount: 1, implementedCount: 0 },
    ]})], []);
    expect(v.nextAction.kind).toBe('implement-scenarios');
  });
  it('malformed behavioral commit suggests fix-commit-format', () => {
    const v = computeVector(
      branch({ behavioralCommits: [{ sha: 'a', subject: 'behavior: x', wellFormed: false, missingSections: ['Why:'] }] }),
      [story()], [],
    );
    expect(v.nextAction.kind).toBe('fix-commit-format');
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `pnpm vitest run packages/cp-core/src/core.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 5: Write minimal implementation**

Create `packages/cp-core/src/index.ts`:

```ts
import type {
  BranchFacts, StoryFacts, StoryReadiness, GateReadiness, GateKind,
  Vector, NextAction,
} from '@canon/cp-contracts';

const ALL_KINDS: GateKind[] = ['e2e', 'perf', 'security', 'a11y'];

export function computeStoryGates(story: StoryFacts): GateReadiness[] {
  return ALL_KINDS.map((kind) => {
    const inKind = story.scenarios.filter((s) => s.kind === kind);
    if (inKind.length === 0) return { kind, state: 'missing' };
    const anyImplemented = inKind.some((s) => s.state === 'implemented');
    return { kind, state: anyImplemented ? 'implemented' : 'scaffold' };
  });
}

function toReadiness(story: StoryFacts): StoryReadiness {
  return { ...story, gates: computeStoryGates(story) };
}

function deriveNextAction(stories: StoryReadiness[], branch: BranchFacts): NextAction {
  for (const s of stories) {
    if (!s.specPresent) {
      return { kind: 'write-spec', label: 'Write user-spec', reason: `${s.dir} has no user-spec.md` };
    }
    if (s.specValid === false) {
      return { kind: 'fix-spec', label: 'Fix spec frontmatter', reason: s.specErrors.join('; ') };
    }
  }
  for (const s of stories) {
    const e2e = s.gates.find((g) => g.kind === 'e2e')!;
    if (e2e.state === 'missing') {
      return { kind: 'add-e2e', label: 'Add e2e scenarios', reason: `${s.dir} has no e2e (mandatory)` };
    }
  }
  for (const s of stories) {
    if (s.gates.some((g) => g.state === 'scaffold')) {
      return { kind: 'implement-scenarios', label: 'Implement scenarios', reason: `${s.dir} has scaffold scenarios` };
    }
  }
  if (branch.behavioralCommits.some((c) => !c.wellFormed)) {
    return { kind: 'fix-commit-format', label: 'Fix commit format', reason: 'A behavioral commit is missing sections' };
  }
  if (branch.merged) return { kind: 'none', label: 'Live', reason: 'Merged into main' };
  return { kind: 'open-pr', label: 'Open PR', reason: 'Readiness satisfied; open a PR (forge — next slice)' };
}

export function computeVector(
  branch: BranchFacts,
  stories: StoryFacts[],
  candidateOwners: string[],
): Vector {
  const readiness = stories.map(toReadiness);
  return {
    branch: branch.branch,
    state: branch.merged ? 'live' : 'private-wip',
    merged: branch.merged,
    stories: readiness,
    frameworksTouched: branch.frameworksTouched,
    constitutionTouched: branch.constitutionTouched,
    behavioralCommits: branch.behavioralCommits,
    candidateOwners,
    nextAction: deriveNextAction(readiness, branch),
    forge: { prState: 'unknown', ci: 'unknown', approvals: 'unknown' },
  };
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm vitest run packages/cp-core/src/core.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 7: Commit**

```bash
git add packages/cp-core
git commit -m "feat(cp-core): pure vector state + readiness + next-action engine"
```

---

## Task 8: cp-server — assemble facts and expose the API

**Files:**
- Create: `apps/cp-server/package.json`
- Create: `apps/cp-server/tsconfig.json`
- Create: `apps/cp-server/src/assemble.ts`
- Create: `apps/cp-server/src/app.ts`
- Create: `apps/cp-server/src/main.ts`
- Test: `apps/cp-server/src/app.test.ts`

- [ ] **Step 1: Create package manifest**

Create `apps/cp-server/package.json`:

```json
{
  "name": "@canon/cp-server",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "node --experimental-strip-types src/main.ts",
    "build": "tsc -b",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@canon/cp-contracts": "workspace:*",
    "@canon/cp-core": "workspace:*",
    "@canon/cp-git": "workspace:*",
    "@canon/cp-spec": "workspace:*",
    "fastify": "5.2.1",
    "@fastify/static": "8.0.4",
    "socket.io": "4.8.1"
  },
  "devDependencies": { "typescript": "6.0.3", "@types/node": "24.12.4" }
}
```

- [ ] **Step 2: Create package tsconfig**

Create `apps/cp-server/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "composite": true, "rootDir": "src", "outDir": "dist", "module": "NodeNext", "moduleResolution": "NodeNext" },
  "references": [
    { "path": "../../packages/cp-contracts" },
    { "path": "../../packages/cp-core" },
    { "path": "../../packages/cp-git" },
    { "path": "../../packages/cp-spec" }
  ],
  "include": ["src"]
}
```

- [ ] **Step 3: Install deps**

Run: `pnpm install`
Expected: fastify, @fastify/static, socket.io installed.

- [ ] **Step 4: Write the assembler (facts → vectors)**

Create `apps/cp-server/src/assemble.ts`:

```ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readRepo } from '@canon/cp-git';
import { validateUserSpec, gateKindForPath, parseScenarioSource, parseCodeowners, ownersForPaths } from '@canon/cp-spec';
import { computeVector } from '@canon/cp-core';
import type { Vector, StoryFacts, ScenarioFile } from '@canon/cp-contracts';

function storySlugFromPath(path: string): { slug: string; dir: string } | null {
  const m = path.match(/^(stories\/.*?\/([^/]+))\/(user-spec\.md|e2e\/|perf\/|security\/|a11y\/)/);
  if (!m) return null;
  return { dir: m[1]!, slug: m[2]! };
}

export async function assembleVectors(repoPath: string, main = 'main'): Promise<Vector[]> {
  const repo = await readRepo(repoPath, main);
  const schema = JSON.parse(readFileSync(join(repoPath, 'templates/story/user-spec.schema.json'), 'utf8'));
  let ownerRules;
  try { ownerRules = parseCodeowners(readFileSync(join(repoPath, '.github/CODEOWNERS'), 'utf8')); }
  catch { ownerRules = []; }

  const vectors: Vector[] = [];
  for (const branch of repo.branches) {
    const storyDirs = new Map<string, string>();
    for (const p of branch.diffPaths) {
      const info = storySlugFromPath(p);
      if (info) storyDirs.set(info.dir, info.slug);
    }

    const stories: StoryFacts[] = [];
    for (const [dir, slug] of storyDirs) {
      const specMd = await repo.readFileAtRef(branch.branch, `${dir}/user-spec.md`);
      const specPresent = specMd !== null;
      const validation = specPresent ? validateUserSpec(specMd!, schema) : null;

      const scenarios: ScenarioFile[] = [];
      for (const p of branch.diffPaths) {
        if (!p.startsWith(`${dir}/`)) continue;
        const kind = gateKindForPath(p);
        if (!kind) continue;
        const src = await repo.readFileAtRef(branch.branch, p);
        if (src === null) continue;
        const parsed = parseScenarioSource(src);
        scenarios.push({ path: p, kind, state: parsed.state, todoCount: parsed.todoCount, implementedCount: parsed.implementedCount });
      }

      stories.push({
        slug, dir, specPresent,
        specValid: validation ? validation.valid : null,
        specErrors: validation ? validation.errors : [],
        scenarios,
      });
    }

    const owners = ownersForPaths(branch.diffPaths, ownerRules);
    vectors.push(computeVector(branch, stories, owners));
  }
  return vectors;
}
```

- [ ] **Step 5: Write the Fastify app factory**

Create `apps/cp-server/src/app.ts`:

```ts
import Fastify, { type FastifyInstance } from 'fastify';
import { assembleVectors } from './assemble';

export function buildApp(repoPath: string, main = 'main'): FastifyInstance {
  const app = Fastify({ logger: false });

  app.get('/api/vectors', async () => {
    return { vectors: await assembleVectors(repoPath, main) };
  });

  app.get('/api/vectors/:branch', async (req, reply) => {
    const { branch } = req.params as { branch: string };
    const vectors = await assembleVectors(repoPath, main);
    const found = vectors.find((v) => v.branch === branch);
    if (!found) return reply.code(404).send({ error: 'vector not found' });
    return found;
  });

  return app;
}
```

- [ ] **Step 6: Write the failing test**

Create `apps/cp-server/src/app.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { simpleGit } from 'simple-git';
import { buildApp } from './app';

let dir: string;

beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), 'cp-server-'));
  const g = simpleGit(dir);
  await g.init(['-b', 'main']);
  await g.addConfig('user.email', 't@t.t');
  await g.addConfig('user.name', 'T');
  mkdirSync(join(dir, 'templates/story'), { recursive: true });
  mkdirSync(join(dir, '.github'), { recursive: true });
  // Reuse the real schema from the repo under test.
  cpSync(
    join(process.cwd(), 'templates/story/user-spec.schema.json'),
    join(dir, 'templates/story/user-spec.schema.json'),
  );
  writeFileSync(join(dir, '.github/CODEOWNERS'), '/stories/   @owner\n');
  writeFileSync(join(dir, 'README.md'), '# root\n');
  await g.add('.'); await g.commit('chore: init');

  await g.checkoutLocalBranch('feature');
  mkdirSync(join(dir, 'stories/auth/login/e2e'), { recursive: true });
  writeFileSync(join(dir, 'stories/auth/login/user-spec.md'), '---\ntitle: User signs in\nslug: login\n---\n');
  writeFileSync(join(dir, 'stories/auth/login/e2e/s.spec.ts'), "test('a', () => {});\n");
  await g.add('.'); await g.commit('behavior: add login\n\nWhy: a\nConsidered: a\nChose: a\nAffects: x');
  await g.checkout('main');
});

afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe('GET /api/vectors', () => {
  it('returns the feature vector with owners and e2e gate', async () => {
    const app = buildApp(dir, 'main');
    const res = await app.inject({ method: 'GET', url: '/api/vectors' });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { vectors: Array<{ branch: string; candidateOwners: string[]; stories: Array<{ gates: Array<{ kind: string; state: string }> }> }> };
    const feature = body.vectors.find((v) => v.branch === 'feature')!;
    expect(feature.candidateOwners).toContain('@owner');
    expect(feature.stories[0]!.gates.find((gt) => gt.kind === 'e2e')!.state).toBe('implemented');
    await app.close();
  });

  it('404s for unknown branch', async () => {
    const app = buildApp(dir, 'main');
    const res = await app.inject({ method: 'GET', url: '/api/vectors/nope' });
    expect(res.statusCode).toBe(404);
    await app.close();
  });
});
```

> Note: this test copies `templates/story/user-spec.schema.json` from the repo root (`process.cwd()`), so run it from the monorepo root.

- [ ] **Step 7: Run test to verify it fails**

Run: `pnpm vitest run apps/cp-server/src/app.test.ts`
Expected: FAIL — `buildApp` / assembler not yet wired (or import error before app.ts/assemble.ts exist).

- [ ] **Step 8: Make tests pass**

The implementations from Steps 4–5 satisfy the test. Re-run:

Run: `pnpm vitest run apps/cp-server/src/app.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 9: Write the entrypoint**

Create `apps/cp-server/src/main.ts`:

```ts
import { buildApp } from './app';

const repoPath = process.env.CP_REPO ?? process.cwd();
const main = process.env.CP_MAIN ?? 'main';
const port = Number(process.env.CP_PORT ?? 4317);

const app = buildApp(repoPath, main);
app.listen({ port, host: '127.0.0.1' })
  .then(() => console.log(`control-plane API on http://127.0.0.1:${port} (repo: ${repoPath})`))
  .catch((err) => { console.error(err); process.exit(1); });
```

- [ ] **Step 10: Smoke-test the server manually**

Run: `CP_REPO="$PWD" node --experimental-strip-types apps/cp-server/src/main.ts &` then `curl -s localhost:4317/api/vectors | head -c 200; kill %1`
Expected: JSON beginning with `{"vectors":`.

- [ ] **Step 11: Commit**

```bash
git add apps/cp-server
git commit -m "feat(cp-server): assemble facts and expose /api/vectors"
```

---

## Task 9: cp-web — Vite + React + shadcn dashboard

**Files:**
- Create: `apps/cp-web/package.json`, `apps/cp-web/vite.config.ts`, `apps/cp-web/tsconfig.json`, `apps/cp-web/index.html`
- Create: `apps/cp-web/src/main.tsx`, `apps/cp-web/src/api.ts`, `apps/cp-web/src/Dashboard.tsx`
- Test: `apps/cp-web/src/api.test.ts`

- [ ] **Step 1: Scaffold the Vite React app**

Run from monorepo root:

```bash
pnpm create vite@latest apps/cp-web -- --template react-ts
```

Then set `apps/cp-web/package.json` name and scripts:

```json
{
  "name": "@canon/cp-web",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run"
  }
}
```

- [ ] **Step 2: Add Tailwind + shadcn/ui**

Run:

```bash
cd apps/cp-web
pnpm add -D tailwindcss @tailwindcss/vite
pnpm dlx shadcn@latest init -d
pnpm dlx shadcn@latest add card badge button
cd ../..
pnpm install
```

Ensure `apps/cp-web/vite.config.ts` registers the Tailwind plugin and the dev proxy:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:4317',
      '/socket.io': { target: 'http://127.0.0.1:4317', ws: true },
    },
  },
});
```

- [ ] **Step 3: Write the failing test (API client shape)**

Create `apps/cp-web/src/api.test.ts`:

```ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchVectors } from './api';

afterEach(() => vi.restoreAllMocks());

describe('fetchVectors', () => {
  it('returns the vectors array from the API', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ vectors: [{ branch: 'feature', state: 'private-wip' }] }),
    })) as unknown as typeof fetch);
    const vectors = await fetchVectors();
    expect(vectors).toHaveLength(1);
    expect(vectors[0]!.branch).toBe('feature');
  });

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500 })) as unknown as typeof fetch);
    await expect(fetchVectors()).rejects.toThrow();
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `pnpm --filter @canon/cp-web test`
Expected: FAIL — `./api` not found. (If vitest is not yet a dep of cp-web, add it: `pnpm --filter @canon/cp-web add -D vitest`.)

- [ ] **Step 5: Write the API client**

Create `apps/cp-web/src/api.ts`:

```ts
import type { Vector } from '@canon/cp-contracts';

export async function fetchVectors(): Promise<Vector[]> {
  const res = await fetch('/api/vectors');
  if (!res.ok) throw new Error(`GET /api/vectors failed: ${res.status}`);
  const body = (await res.json()) as { vectors: Vector[] };
  return body.vectors;
}
```

Add `@canon/cp-contracts` to `apps/cp-web/package.json` dependencies (`"@canon/cp-contracts": "workspace:*"`) and run `pnpm install`.

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm --filter @canon/cp-web test`
Expected: PASS (2 tests).

- [ ] **Step 7: Write the Dashboard component**

Create `apps/cp-web/src/Dashboard.tsx`:

```tsx
import { useEffect, useState } from 'react';
import type { Vector, GateReadiness } from '@canon/cp-contracts';
import { fetchVectors } from './api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const STATE_LABEL: Record<Vector['state'], string> = {
  'private-wip': 'Private WIP',
  'live': 'Live',
  'under-review': 'Under review',
  'ready-to-merge': 'Ready to merge',
};

function gateLine(g: GateReadiness): string {
  const mark = g.state === 'implemented' ? '✓' : g.state === 'scaffold' ? '◐' : '·';
  return `${mark} ${g.kind}`;
}

export function Dashboard() {
  const [vectors, setVectors] = useState<Vector[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVectors().then(setVectors).catch((e) => setError(String(e)));
  }, []);

  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <main className="p-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {vectors.map((v) => (
        <Card key={v.branch} data-testid={`vector-${v.branch}`}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{v.branch}</span>
              <Badge>{STATE_LABEL[v.state]}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>{v.stories.length} story(ies) · owners: {v.candidateOwners.join(', ') || '—'}</div>
            {v.stories.map((s) => (
              <div key={s.dir} className="font-mono text-xs">
                {s.slug}: {s.gates.map(gateLine).join('  ')}
                {s.specValid === false ? '  ⚠ spec invalid' : ''}
              </div>
            ))}
            <div className="pt-2 font-medium">→ {v.nextAction.label}</div>
            <div className="text-xs text-muted-foreground">{v.nextAction.reason}</div>
          </CardContent>
        </Card>
      ))}
    </main>
  );
}
```

- [ ] **Step 8: Wire it into the app root**

Replace `apps/cp-web/src/main.tsx`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { Dashboard } from './Dashboard';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Dashboard />
  </StrictMode>,
);
```

- [ ] **Step 9: Verify build**

Run: `pnpm --filter @canon/cp-web build`
Expected: build succeeds, emits `apps/cp-web/dist`.

- [ ] **Step 10: Commit**

```bash
git add apps/cp-web
git commit -m "feat(cp-web): dashboard grid of vectors with readiness and next-action"
```

---

## Task 10: Serve the SPA from cp-server

**Files:**
- Modify: `apps/cp-server/src/app.ts`
- Modify: `apps/cp-server/package.json`

- [ ] **Step 1: Add static serving to the app factory**

Edit `apps/cp-server/src/app.ts` — add the static plugin after the API routes, guarded so it is skipped when the build is absent (keeps tests green):

```ts
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import fastifyStatic from '@fastify/static';
// ...inside buildApp, after the two app.get routes, before `return app;`:
const webDist = join(dirname(fileURLToPath(import.meta.url)), '../../cp-web/dist');
if (existsSync(webDist)) {
  app.register(fastifyStatic, { root: webDist });
  app.setNotFoundHandler((req, reply) => {
    if (req.url.startsWith('/api')) return reply.code(404).send({ error: 'not found' });
    return reply.sendFile('index.html');
  });
}
```

- [ ] **Step 2: Re-run the server tests (still green without a build)**

Run: `pnpm vitest run apps/cp-server/src/app.test.ts`
Expected: PASS (2 tests) — static block is skipped because `cp-web/dist` may be absent in CI; the 404 test still asserts the `/api` path.

- [ ] **Step 3: End-to-end manual check**

Run:

```bash
pnpm cp:build
CP_REPO="$PWD" node --experimental-strip-types apps/cp-server/src/main.ts
```

Open `http://127.0.0.1:4317` — the dashboard renders the repo's branches (at minimum any feature branches with stories). Stop with Ctrl-C.

- [ ] **Step 4: Commit**

```bash
git add apps/cp-server
git commit -m "feat(cp-server): serve the built SPA via @fastify/static"
```

---

## Task 11: frameworks/perf (k6) skeleton — "prepare everything"

**Files:**
- Create: `frameworks/perf/package.json`
- Create: `frameworks/perf/README.md`
- Create: `frameworks/perf/index.ts`
- Create: `templates/story/perf-scenario.template.k6.ts`

- [ ] **Step 1: Create the perf framework package**

Create `frameworks/perf/package.json`:

```json
{
  "name": "@canon/perf-framework",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": { ".": "./index.ts" },
  "scripts": {
    "test": "echo 'k6 execution wired in slice 2 (workers)'; exit 0",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": { "typescript": "6.0.3", "@types/k6": "0.54.2" }
}
```

- [ ] **Step 2: Create the framework vocabulary stub**

Create `frameworks/perf/index.ts`:

```ts
// Perf framework (k6) — bilateral contract surface for performance scenarios.
// Mirrors the e2e framework: scenarios consume verbs; helpers hold the route shapes
// the code perimeter must expose. Execution is wired in slice 2 (workers).
//
// Example consumer (stories/<...>/perf/<scenario>.k6.ts):
//   import { perfClient } from '@canon/perf-framework';
//   export default function () { perfClient.runLoginRequest(); }

export interface PerfClient {
  runLoginRequest(): void;
}

export const perfClient: PerfClient = {
  runLoginRequest() {
    throw new Error('perf verbs are implemented per project; see frameworks/perf/README.md');
  },
};
```

- [ ] **Step 3: Create the README and scenario template**

Create `frameworks/perf/README.md`:

```md
# Perf framework (k6)

Performance gates for Stories. Scenarios live at `stories/<...>/perf/<scenario>.k6.ts`
and are **optional** per Story (the control plane treats a missing `perf/` folder as N/A,
a present-but-todo scenario as scaffold, and an implemented scenario as ready).

Execution (running k6, collecting thresholds) is delivered in slice 2 alongside the
e2e/worker execution layer. This package currently provides the contract surface only.
```

Create `templates/story/perf-scenario.template.k6.ts`:

```ts
// Template for a k6 perf scenario. Replace the body and thresholds for the Story.
// Until executable, keep it minimal; the control plane reports it as scaffold.
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1,
  duration: '10s',
  thresholds: { http_req_duration: ['p(95)<5000'] }, // e.g. G-X: P95 ≤ 5s
};

export default function () {
  const res = http.get('http://localhost:3000/'); // point at the system under test
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
```

- [ ] **Step 4: Install and verify the workspace still resolves**

Run: `pnpm install && pnpm typecheck`
Expected: install succeeds; `tsc -b` builds all referenced projects without error.

- [ ] **Step 5: Commit**

```bash
git add frameworks/perf templates/story/perf-scenario.template.k6.ts
git commit -m "feat(frameworks): add k6 perf framework skeleton and scenario template"
```

---

## Task 12: Full-suite green + README

**Files:**
- Create: `apps/cp-server/README.md`

- [ ] **Step 1: Run the entire unit suite**

Run: `pnpm test`
Expected: all Vitest suites PASS (cp-spec, cp-git, cp-core, cp-server, cp-web api).

- [ ] **Step 2: Typecheck the whole solution**

Run: `pnpm typecheck`
Expected: `tsc -b` succeeds across all project references.

- [ ] **Step 3: Document how to run the control plane**

Create `apps/cp-server/README.md`:

```md
# Control Plane (slice 1)

Read-only delivery control plane: a view over the master repo's git + artifacts.

## Run

    pnpm cp:build
    CP_REPO="/path/to/master-repo" node --experimental-strip-types apps/cp-server/src/main.ts
    # open http://127.0.0.1:4317

Env: `CP_REPO` (default: cwd), `CP_MAIN` (default: `main`), `CP_PORT` (default: 4317).

## Dev (HMR)

    pnpm cp:server   # API on :4317
    pnpm cp:dev      # Vite on :5173, proxies /api → :4317

## Scope

Slice 1 derives state from local git + files only. PR/CI/approvals (forge) and
test execution are out of scope and reported as `unknown` — added in slices 2–3.
```

- [ ] **Step 4: Commit**

```bash
git add apps/cp-server/README.md
git commit -m "docs(cp-server): how to run the slice-1 control plane"
```

---

## Self-review notes (already reconciled)

- **Spec coverage:** vector model (Task 7), canonical state subset live/private-wip (Task 7), readiness signals — spec validity (Task 3), gate kinds + scaffold/implemented (Tasks 4,7), frameworks/constitution touched + behavioral commits (Task 6), CODEOWNERS owners (Tasks 5,8), next-action (Task 7), local-only assembly (Task 8), API + SPA (Tasks 8–10), k6 prep (Task 11). Forge/execution explicitly deferred and surfaced as `unknown`.
- **Type consistency:** all packages import the names fixed in Task 2 (`BranchFacts`, `StoryFacts`, `GateReadiness`, `Vector`, `NextAction`, `GateKind`, `ScenarioFile`). The engine emits `Vector`; the API serializes it; the web client imports the same `Vector`.
- **Open conventions from spec §11:** resolved in code — scaffold parsing (Task 4), gate-kind mapping (Task 4), diff strategy three-dot `main...branch` (Task 6), behavioral-commit sections (Task 6), CODEOWNERS last-match-wins (Task 5).
```
