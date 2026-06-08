import { useEffect, useState } from 'react';
import type { Vector, GateReadiness } from '@canon/cp-contracts';
import type { RunType } from '@canon/cp-contracts';
import { fetchVectors } from './api';
import { startRun } from './runs';
import { Terminal } from './Terminal';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const STATE_LABEL: Record<Vector['state'], string> = {
  'private-wip': 'Private WIP',
  'live': 'Live',
  'under-review': 'Under review',
  'ready-to-merge': 'Ready to merge',
};

function gateLine(g: GateReadiness): string {
  const mark = g.state === 'implemented' ? '✓' : g.state === 'scaffold' ? '◐' : '·';
  return `${mark} ${g.kind}`;
}

export function Dashboard() {
  const [vectors, setVectors] = useState<Vector[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeRun, setActiveRun] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);

  useEffect(() => {
    fetchVectors().then(setVectors).catch((e) => setError(String(e)));
  }, []);

  async function launch(type: RunType) {
    setRunError(null);
    try { setActiveRun(await startRun(type)); }
    catch (e) { setRunError(String(e)); }
  }

  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <>
      <div className="p-6 pb-0 flex flex-wrap items-center gap-2">
        <span className="font-semibold mr-2">Runs:</span>
        <Button onClick={() => launch('e2e')}>Run e2e</Button>
        <Button onClick={() => launch('typecheck')}>Typecheck</Button>
        <Button onClick={() => launch('agent')}>Agent (Claude)</Button>
        {runError && <span className="text-red-600 text-sm">{runError}</span>}
      </div>
      {activeRun && (
        <div className="px-6 pt-4">
          <Terminal runId={activeRun} />
        </div>
      )}
      <main className="p-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {vectors.map((v) => (
          <Card key={v.branch} data-testid={`vector-${v.branch}`}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{v.branch}</span>
                <Badge>{STATE_LABEL[v.state]}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>{v.stories.length} story(ies) · owners: {v.candidateOwners.join(', ') || '—'}</div>
              {v.stories.map((s) => (
                <div key={s.dir} className="font-mono text-xs">
                  {s.slug}: {s.gates.map(gateLine).join('  ')}
                  {s.specValid === false ? '  ⚠ spec invalid' : ''}
                </div>
              ))}
              {v.forge.prNumber !== undefined && (
                <div className="text-xs">
                  <a href={v.forge.url} target="_blank" rel="noreferrer" className="underline">PR #{v.forge.prNumber}</a>
                  {' · CI '}{v.forge.ci === 'success' ? '✓' : v.forge.ci === 'failure' ? '✗' : v.forge.ci === 'pending' ? '⏳' : '—'}
                  {' · review: '}{v.forge.approvals}
                </div>
              )}
              <div className="pt-2 font-medium">→ {v.nextAction.label}</div>
              <div className="text-xs text-gray-500">{v.nextAction.reason}</div>
            </CardContent>
          </Card>
        ))}
      </main>
    </>
  );
}
