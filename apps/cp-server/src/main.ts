import { buildApp } from './app';
import { RunRegistry } from '@canon/cp-workers';
import { attachRunSockets } from './sockets';
import { fetchForge } from '@canon/cp-forge';

const repoPath = process.env['CP_REPO'] ?? process.cwd();
const main = process.env['CP_MAIN'] ?? 'main';
const port = Number(process.env['CP_PORT'] ?? 4317);

const registry = new RunRegistry(repoPath);
const forgeFetcher = process.env.CP_FORGE === '0' ? async () => new Map() : fetchForge;
const app = buildApp(repoPath, main, registry, forgeFetcher);
app.listen({ port, host: '127.0.0.1' })
  .then(() => {
    attachRunSockets(app.server, registry);
    console.log(`control-plane on http://127.0.0.1:${port} (repo: ${repoPath})`);
  })
  .catch((err) => { console.error(err); process.exit(1); });
