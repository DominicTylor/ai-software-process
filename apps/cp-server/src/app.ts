import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import Fastify, { type FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
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

  const webDist = join(dirname(fileURLToPath(import.meta.url)), '../../cp-web/dist');
  if (existsSync(webDist)) {
    app.register(fastifyStatic, { root: webDist });
    app.setNotFoundHandler((req, reply) => {
      if (req.url.startsWith('/api')) return reply.code(404).send({ error: 'not found' });
      return reply.sendFile('index.html');
    });
  }

  return app;
}
