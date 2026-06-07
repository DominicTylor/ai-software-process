import type { Vector } from '@canon/cp-contracts';

export async function fetchVectors(): Promise<Vector[]> {
  const res = await fetch('/api/vectors');
  if (!res.ok) throw new Error(`GET /api/vectors failed: ${res.status}`);
  const body = (await res.json()) as { vectors: Vector[] };
  return body.vectors;
}
