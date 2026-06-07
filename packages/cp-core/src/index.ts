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
