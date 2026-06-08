import { describe, it, expect, vi, afterEach } from 'vitest';
import { startRun, listRuns } from './runs';

afterEach(() => vi.restoreAllMocks());

describe('runs api', () => {
  it('startRun posts the type and returns the id', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, status: 201, json: async () => ({ id: 'r1' }) }));
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);
    const id = await startRun('e2e');
    expect(id).toBe('r1');
    expect(fetchMock).toHaveBeenCalledWith('/api/runs', expect.objectContaining({ method: 'POST' }));
  });

  it('listRuns returns the runs array', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ runs: [{ id: 'r1', type: 'e2e', label: 'e2e', status: 'running', exitCode: null }] }) })) as unknown as typeof fetch);
    const runs = await listRuns();
    expect(runs[0]!.id).toBe('r1');
  });

  it('startRun throws on non-ok', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 400 })) as unknown as typeof fetch);
    await expect(startRun('e2e')).rejects.toThrow();
  });
});
