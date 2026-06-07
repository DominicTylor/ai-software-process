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
