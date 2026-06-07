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
