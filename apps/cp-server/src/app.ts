import Fastify, { type FastifyInstance } from 'fastify';
import { assembleVectors } from './assemble';

export function buildApp(repoPath: string, main = 'main'): FastifyInstance {
  const app = Fastify({ logger: false });

  app.get('/api/vectors', async () => {
    return { vectors: await assembleVectors(repoPath, main) };
  });

  app.get('/api/vectors/:branch', async (req, reply) => {
    const { branch } = req.params as { branch: string };
    const vectors = await assembleVectors(repoPath, main);
    const found = vectors.find((v) => v.branch === branch);
    if (!found) return reply.code(404).send({ error: 'vector not found' });
    return found;
  });

  return app;
}
