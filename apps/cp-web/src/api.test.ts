import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchVectors } from './api';

afterEach(() => vi.restoreAllMocks());

describe('fetchVectors', () => {
  it('returns the vectors array from the API', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ vectors: [{ branch: 'feature', state: 'private-wip' }] }),
    })) as unknown as typeof fetch);
    const vectors = await fetchVectors();
    expect(vectors).toHaveLength(1);
    expect(vectors[0]!.branch).toBe('feature');
  });

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500 })) as unknown as typeof fetch);
    await expect(fetchVectors()).rejects.toThrow();
  });
});
