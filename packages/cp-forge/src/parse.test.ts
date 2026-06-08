import { describe, it, expect } from 'vitest';
import { parseForge } from './parse';

const SAMPLE = JSON.stringify([
  { headRefName: 'feat/login', number: 12, url: 'https://x/pull/12', state: 'OPEN', isDraft: false, reviewDecision: 'APPROVED',
    statusCheckRollup: [ { __typename: 'CheckRun', status: 'COMPLETED', conclusion: 'SUCCESS' }, { __typename: 'CheckRun', status: 'COMPLETED', conclusion: 'SUCCESS' } ] },
  { headRefName: 'feat/perf', number: 13, url: 'https://x/pull/13', state: 'OPEN', isDraft: true, reviewDecision: null,
    statusCheckRollup: [{ __typename: 'CheckRun', status: 'IN_PROGRESS', conclusion: null }] },
  { headRefName: 'fix/bug', number: 9, url: 'https://x/pull/9', state: 'OPEN', isDraft: false, reviewDecision: 'CHANGES_REQUESTED',
    statusCheckRollup: [{ __typename: 'CheckRun', status: 'COMPLETED', conclusion: 'FAILURE' }] },
  { headRefName: 'done', number: 5, url: 'https://x/pull/5', state: 'MERGED', isDraft: false, reviewDecision: 'APPROVED', statusCheckRollup: [] },
]);

describe('parseForge', () => {
  it('maps an approved, green, open PR', () => {
    expect(parseForge(SAMPLE).get('feat/login')).toEqual({ prNumber: 12, url: 'https://x/pull/12', prState: 'open', ci: 'success', reviewDecision: 'approved' });
  });
  it('marks draft PRs and pending CI', () => {
    const f = parseForge(SAMPLE).get('feat/perf')!;
    expect(f.prState).toBe('draft'); expect(f.ci).toBe('pending'); expect(f.reviewDecision).toBe('none');
  });
  it('rolls up a failing check', () => {
    expect(parseForge(SAMPLE).get('fix/bug')!.ci).toBe('failure');
    expect(parseForge(SAMPLE).get('fix/bug')!.reviewDecision).toBe('changes_requested');
  });
  it('maps merged state and empty rollup → none', () => {
    const f = parseForge(SAMPLE).get('done')!;
    expect(f.prState).toBe('merged'); expect(f.ci).toBe('none');
  });
  it('returns an empty map for invalid/empty input', () => {
    expect(parseForge('').size).toBe(0);
    expect(parseForge('not json').size).toBe(0);
    expect(parseForge('[]').size).toBe(0);
  });
});
