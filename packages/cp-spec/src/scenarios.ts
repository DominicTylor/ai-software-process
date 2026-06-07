import type { GateKind, ScenarioState } from '@canon/cp-contracts';

const GATE_DIRS: GateKind[] = ['e2e', 'perf', 'security', 'a11y'];

export function gateKindForPath(path: string): GateKind | null {
  const parts = path.split('/');
  // Gate kinds are only valid inside stories/ subtree
  if (parts[0] !== 'stories') return null;
  for (const kind of GATE_DIRS) {
    const i = parts.indexOf(kind);
    // Must be a directory (not the last segment) and must be at depth >= 4
    // (stories/<grouping>/<slug>/<gate>/<file>)
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
