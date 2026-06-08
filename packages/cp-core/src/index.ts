import type {
  BranchFacts, StoryFacts, StoryReadiness, GateReadiness, GateKind,
  Vector, NextAction, ForgeFacts,
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

function deriveState(branch: BranchFacts, forge?: ForgeFacts): Vector['state'] {
  if (branch.merged || forge?.prState === 'merged') return 'live';
  if (!forge || forge.prState === 'closed' || forge.prState === 'draft') return 'private-wip';
  if (forge.prState === 'open') {
    return forge.reviewDecision === 'approved' && forge.ci === 'success' ? 'ready-to-merge' : 'under-review';
  }
  return 'private-wip';
}

function deriveNextAction(stories: StoryReadiness[], branch: BranchFacts, forge?: ForgeFacts): NextAction {
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
  if (branch.merged || forge?.prState === 'merged') return { kind: 'none', label: 'Live', reason: 'Merged into main' };
  if (!forge || forge.prState === 'closed' || forge.prState === 'draft') {
    return { kind: 'open-pr', label: 'Open PR', reason: 'Readiness satisfied; open a PR' };
  }
  if (forge.ci === 'failure') return { kind: 'fix-ci', label: 'Fix CI', reason: `PR #${forge.prNumber} has failing checks` };
  if (forge.reviewDecision === 'changes_requested') return { kind: 'address-review', label: 'Address review', reason: `PR #${forge.prNumber} has requested changes` };
  if (forge.ci === 'pending') return { kind: 'wait-ci', label: 'Wait for CI', reason: `PR #${forge.prNumber} checks are running` };
  if (forge.reviewDecision === 'approved' && forge.ci === 'success') return { kind: 'merge', label: 'Merge', reason: `PR #${forge.prNumber} is approved and green` };
  return { kind: 'await-review', label: 'Awaiting review', reason: `PR #${forge.prNumber} is open and awaiting approval` };
}

export function computeVector(
  branch: BranchFacts,
  stories: StoryFacts[],
  candidateOwners: string[],
  forge?: ForgeFacts,
): Vector {
  const readiness = stories.map(toReadiness);
  const forgeView = forge
    ? { prState: forge.prState, ci: forge.ci, approvals: forge.reviewDecision, prNumber: forge.prNumber, url: forge.url }
    : { prState: 'unknown' as const, ci: 'unknown' as const, approvals: 'unknown' as const };
  return {
    branch: branch.branch,
    state: deriveState(branch, forge),
    merged: branch.merged,
    stories: readiness,
    frameworksTouched: branch.frameworksTouched,
    constitutionTouched: branch.constitutionTouched,
    behavioralCommits: branch.behavioralCommits,
    candidateOwners,
    nextAction: deriveNextAction(readiness, branch, forge),
    forge: forgeView,
  };
}
