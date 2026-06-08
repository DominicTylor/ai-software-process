import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import Fastify, { type FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import { RunRegistry } from '@canon/cp-workers';
import { assembleVectors, type ForgeFetcher } from './assemble';
import { registerRunRoutes } from './runs';

export function buildApp(
  repoPath: string,
  main = 'main',
  registry: RunRegistry = new RunRegistry(repoPath),
  forgeFetcher: ForgeFetcher = async () => new Map(),
): FastifyInstance {
  const app = Fastify({ logger: false });

  app.get('/api/vectors', async () => {
    return { vectors: await assembleVectors(repoPath, main, forgeFetcher) };
  });

  app.get('/api/vectors/*', async (req, reply) => {
    const branch = (req.params as { '*': string })['*'];
    const vectors = await assembleVectors(repoPath, main, forgeFetcher);
    const found = vectors.find((v) => v.branch === branch);
    if (!found) return reply.code(404).send({ error: 'vector not found' });
    return found;
  });

  registerRunRoutes(app, registry);

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
