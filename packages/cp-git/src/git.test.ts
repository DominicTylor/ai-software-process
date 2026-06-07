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
