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

describe('computeVector — additional coverage', () => {
  it('missing spec suggests write-spec', () => {
    const v = computeVector(branch(), [story({ specPresent: false, specValid: null })], []);
    expect(v.nextAction.kind).toBe('write-spec');
  });
  it('perf scaffold (with e2e implemented) suggests implement-scenarios', () => {
    const v = computeVector(branch(), [story({ scenarios: [
      { path: 'e', kind: 'e2e', state: 'implemented', todoCount: 0, implementedCount: 1 },
      { path: 'p', kind: 'perf', state: 'scaffold', todoCount: 1, implementedCount: 0 },
    ]})], []);
    expect(v.nextAction.kind).toBe('implement-scenarios');
  });
  it('empty stories on unmerged branch is private-wip with open-pr', () => {
    const v = computeVector(branch(), [], []);
    expect(v.state).toBe('private-wip');
    expect(v.nextAction.kind).toBe('open-pr');
  });
  it('merged branch with invalid spec still suggests fix-spec', () => {
    const v = computeVector(branch({ merged: true }), [story({ specValid: false, specErrors: ['x'] })], []);
    expect(v.nextAction.kind).toBe('fix-spec');
  });
});

import type { ForgeFacts } from '@canon/cp-contracts';

function forge(over: Partial<ForgeFacts> = {}): ForgeFacts {
  return { prNumber: 1, url: 'u', prState: 'open', ci: 'success', reviewDecision: 'review_required', ...over };
}

describe('computeVector — forge', () => {
  it('open PR with ready story is under-review', () => {
    const v = computeVector(branch(), [story()], [], forge());
    expect(v.state).toBe('under-review');
    expect(v.nextAction.kind).toBe('await-review');
    expect(v.forge.prState).toBe('open');
    expect(v.forge.approvals).toBe('review_required');
    expect(v.forge.prNumber).toBe(1);
  });
  it('approved + green is ready-to-merge → merge', () => {
    const v = computeVector(branch(), [story()], [], forge({ reviewDecision: 'approved', ci: 'success' }));
    expect(v.state).toBe('ready-to-merge');
    expect(v.nextAction.kind).toBe('merge');
  });
  it('failing CI → fix-ci', () => {
    const v = computeVector(branch(), [story()], [], forge({ ci: 'failure' }));
    expect(v.state).toBe('under-review');
    expect(v.nextAction.kind).toBe('fix-ci');
  });
  it('changes requested → address-review', () => {
    const v = computeVector(branch(), [story()], [], forge({ reviewDecision: 'changes_requested', ci: 'success' }));
    expect(v.nextAction.kind).toBe('address-review');
  });
  it('pending CI → wait-ci', () => {
    const v = computeVector(branch(), [story()], [], forge({ ci: 'pending' }));
    expect(v.nextAction.kind).toBe('wait-ci');
  });
  it('draft PR is private-wip', () => {
    const v = computeVector(branch(), [story()], [], forge({ prState: 'draft' }));
    expect(v.state).toBe('private-wip');
  });
  it('merged PR is live', () => {
    const v = computeVector(branch(), [story()], [], forge({ prState: 'merged' }));
    expect(v.state).toBe('live');
    expect(v.nextAction.kind).toBe('none');
  });
  it('local readiness still takes priority over forge', () => {
    const v = computeVector(branch(), [story({ specValid: false, specErrors: ['x'] })], [], forge({ ci: 'failure' }));
    expect(v.nextAction.kind).toBe('fix-spec');
  });
  it('no forge keeps slice-1 behavior (unknown + open-pr)', () => {
    const v = computeVector(branch(), [story()], []);
    expect(v.forge.prState).toBe('unknown');
    expect(v.nextAction.kind).toBe('open-pr');
  });
});
