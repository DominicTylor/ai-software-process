import type { ForgeFacts, PrState, CiStatus, ReviewDecision } from '@canon/cp-contracts';

interface RollupItem { status?: string; conclusion?: string | null; state?: string }
interface GhPr {
  headRefName: string; number: number; url: string;
  state: string; isDraft: boolean; reviewDecision: string | null;
  statusCheckRollup?: RollupItem[];
}

const FAIL_CONCLUSIONS = new Set(['FAILURE', 'TIMED_OUT', 'CANCELLED', 'ACTION_REQUIRED', 'STARTUP_FAILURE']);
const FAIL_STATES = new Set(['FAILURE', 'ERROR']);

function rollupCi(items: RollupItem[] | undefined): CiStatus {
  if (!items || items.length === 0) return 'none';
  let pending = false;
  for (const it of items) {
    if (it.conclusion && FAIL_CONCLUSIONS.has(it.conclusion)) return 'failure';
    if (it.state && FAIL_STATES.has(it.state)) return 'failure';
    const checkPending = it.status !== undefined && it.status !== 'COMPLETED';
    const ctxPending = it.state === 'PENDING';
    if (checkPending || ctxPending) pending = true;
  }
  return pending ? 'pending' : 'success';
}

function prState(state: string, isDraft: boolean): PrState {
  if (state === 'MERGED') return 'merged';
  if (state === 'CLOSED') return 'closed';
  return isDraft ? 'draft' : 'open';
}

function review(decision: string | null): ReviewDecision {
  switch (decision) {
    case 'APPROVED': return 'approved';
    case 'CHANGES_REQUESTED': return 'changes_requested';
    case 'REVIEW_REQUIRED': return 'review_required';
    default: return 'none';
  }
}

export function parseForge(json: string): Map<string, ForgeFacts> {
  const map = new Map<string, ForgeFacts>();
  let prs: GhPr[];
  try { prs = JSON.parse(json) as GhPr[]; } catch { return map; }
  if (!Array.isArray(prs)) return map;
  for (const pr of prs) {
    if (!pr || typeof pr.headRefName !== 'string') continue;
    const facts: ForgeFacts = {
      prNumber: pr.number, url: pr.url,
      prState: prState(pr.state, pr.isDraft),
      ci: rollupCi(pr.statusCheckRollup),
      reviewDecision: review(pr.reviewDecision),
    };
    const existing = map.get(pr.headRefName);
    if (!existing || existing.prState === 'closed' || existing.prState === 'merged') {
      map.set(pr.headRefName, facts);
    }
  }
  return map;
}
