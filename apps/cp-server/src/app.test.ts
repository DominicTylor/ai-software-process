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
  await g.add('.'); await g.commit('behavior: add login\n\nWhy: aaaaaaaaaaaaaaaaaaaaaa\nConsidered: aaaaaaaaaaaaaaaaaaaaaa\nChose: aaaaaaaaaaaaaaaaaaaaaa\nAffects: stories/auth/login');
  await g.checkout('main');

  await g.checkoutLocalBranch('feat/checkout');
  mkdirSync(join(dir, 'stories/checkout/e2e'), { recursive: true });
  writeFileSync(join(dir, 'stories/checkout/user-spec.md'), '---\ntitle: User checks out\nslug: checkout\n---\n');
  writeFileSync(join(dir, 'stories/checkout/e2e/c.spec.ts'), "test('checks out', () => {});\n");
  await g.add('.'); await g.commit('behavior: add checkout\n\nWhy: aaaaaaaaaaaaaaaaaaaaaa\nConsidered: aaaaaaaaaaaaaaaaaaaaaa\nChose: aaaaaaaaaaaaaaaaaaaaaa\nAffects: stories/checkout');
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

  it('serves a vector whose branch name contains a slash, with flat-layout story', async () => {
    const app = buildApp(dir, 'main');
    const res = await app.inject({ method: 'GET', url: '/api/vectors/feat/checkout' });
    expect(res.statusCode).toBe(200);
    const v = res.json() as { branch: string; stories: Array<{ slug: string; gates: Array<{ kind: string; state: string }> }> };
    expect(v.branch).toBe('feat/checkout');
    expect(v.stories[0]!.slug).toBe('checkout');
    expect(v.stories[0]!.gates.find((g) => g.kind === 'e2e')!.state).toBe('implemented');
    await app.close();
  });
});
