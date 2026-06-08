import { describe, it, expect } from 'vitest';
import { RunRegistry } from '@canon/cp-workers';
import { buildApp } from './app';

describe('runs REST', () => {
  it('creates a custom run and reports it via GET', async () => {
    const reg = new RunRegistry(process.cwd());
    const app = buildApp(process.cwd(), 'main', reg);
    const create = await app.inject({ method: 'POST', url: '/api/runs', payload: { type: 'custom', file: process.execPath, args: ['-e', "process.stdout.write('hi')"] } });
    expect(create.statusCode).toBe(201);
    const { id } = create.json() as { id: string };
    await new Promise((r) => setTimeout(r, 300));
    const detail = await app.inject({ method: 'GET', url: `/api/runs/${id}` });
    expect(detail.statusCode).toBe(200);
    const body = detail.json() as { status: string; output: string };
    expect(body.status).toBe('exited');
    expect(body.output).toContain('hi');
    await app.close();
  });

  it('400s when type missing, 404s for unknown run', async () => {
    const app = buildApp(process.cwd(), 'main', new RunRegistry(process.cwd()));
    expect((await app.inject({ method: 'POST', url: '/api/runs', payload: {} })).statusCode).toBe(400);
    expect((await app.inject({ method: 'GET', url: '/api/runs/nope' })).statusCode).toBe(404);
    await app.close();
  });
});
