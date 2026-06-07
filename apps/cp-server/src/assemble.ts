import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readRepo } from '@canon/cp-git';
import { validateUserSpec, gateKindForPath, parseScenarioSource, parseCodeowners, ownersForPaths, type OwnerRule } from '@canon/cp-spec';
import { computeVector } from '@canon/cp-core';
import type { Vector, StoryFacts, ScenarioFile } from '@canon/cp-contracts';

const STORY_MARKERS = ['/user-spec.md', '/e2e/', '/perf/', '/security/', '/a11y/'];

// Handles BOTH flat (stories/<slug>/...) and grouped (stories/<group>/<slug>/...) layouts.
export function storySlugFromPath(path: string): { slug: string; dir: string } | null {
  if (!path.startsWith('stories/')) return null;
  for (const marker of STORY_MARKERS) {
    const idx = path.indexOf(marker);
    if (idx === -1) continue;
    const dir = path.slice(0, idx);
    const parts = dir.split('/');
    if (parts.length < 2 || parts[0] !== 'stories') continue;
    const slug = parts[parts.length - 1]!;
    return { slug, dir };
  }
  return null;
}

export async function assembleVectors(repoPath: string, main = 'main'): Promise<Vector[]> {
  const repo = await readRepo(repoPath, main);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { $schema: _unused, ...schema } = JSON.parse(readFileSync(join(repoPath, 'templates/story/user-spec.schema.json'), 'utf8')) as Record<string, unknown>;
  let ownerRules: OwnerRule[];
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
