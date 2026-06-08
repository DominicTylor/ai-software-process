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

export type RunType = 'e2e' | 'typecheck' | 'agent' | 'custom';
export type RunStatus = 'running' | 'exited';
export interface RunSummary {
  id: string;
  label: string;
  type: RunType;
  status: RunStatus;
  exitCode: number | null;
}
