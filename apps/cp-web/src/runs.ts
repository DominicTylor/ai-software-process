import type { RunType, RunSummary } from '@canon/cp-contracts';

export async function startRun(type: RunType, extra?: { file?: string; args?: string[] }): Promise<string> {
  const res = await fetch('/api/runs', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type, ...extra }),
  });
  if (!res.ok) throw new Error(`POST /api/runs failed: ${res.status}`);
  const body = (await res.json()) as { id: string };
  return body.id;
}

export async function listRuns(): Promise<RunSummary[]> {
  const res = await fetch('/api/runs');
  if (!res.ok) throw new Error(`GET /api/runs failed: ${res.status}`);
  const body = (await res.json()) as { runs: RunSummary[] };
  return body.runs;
}

export async function stopRun(id: string): Promise<void> {
  const res = await fetch(`/api/runs/${id}/stop`, { method: 'POST' });
  if (!res.ok) throw new Error(`stop failed: ${res.status}`);
}
