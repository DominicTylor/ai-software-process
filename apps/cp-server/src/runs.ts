import type { FastifyInstance } from 'fastify';
import type { RunRegistry } from '@canon/cp-workers';
import type { RunType } from '@canon/cp-contracts';

const AGENT_CMD = process.env.CP_AGENT_CMD ?? 'claude';

interface CreateBody { type: RunType; file?: string; args?: string[] }

function commandFor(body: CreateBody): { file: string; args: string[]; label: string } {
  switch (body.type) {
    case 'e2e': return { file: 'pnpm', args: ['test:e2e'], label: 'e2e (pnpm test:e2e)' };
    case 'typecheck': return { file: 'pnpm', args: ['typecheck'], label: 'typecheck' };
    case 'agent': return { file: AGENT_CMD, args: [], label: `agent (${AGENT_CMD})` };
    case 'custom': {
      if (!body.file) throw new Error('custom run requires a file');
      return { file: body.file, args: body.args ?? [], label: `custom: ${body.file}` };
    }
    default: throw new Error(`unknown run type`);
  }
}

export function registerRunRoutes(app: FastifyInstance, registry: RunRegistry): void {
  app.post('/api/runs', async (req, reply) => {
    const body = (req.body ?? {}) as CreateBody;
    if (!body.type) return reply.code(400).send({ error: 'type required' });
    let cmd;
    try { cmd = commandFor(body); } catch (e) { return reply.code(400).send({ error: String((e as Error).message) }); }
    const id = registry.start({ type: body.type, file: cmd.file, args: cmd.args, label: cmd.label });
    return reply.code(201).send({ id });
  });

  app.get('/api/runs', async () => ({ runs: registry.list() }));

  app.get('/api/runs/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const run = registry.get(id);
    if (!run) return reply.code(404).send({ error: 'run not found' });
    return { id: run.id, type: run.type, label: run.label, status: run.status, exitCode: run.exitCode, output: run.buffer() };
  });

  app.post('/api/runs/:id/stop', async (req, reply) => {
    const { id } = req.params as { id: string };
    if (!registry.get(id)) return reply.code(404).send({ error: 'run not found' });
    registry.stop(id);
    return { stopped: id };
  });
}
