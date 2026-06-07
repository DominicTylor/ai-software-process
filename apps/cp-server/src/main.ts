import { buildApp } from './app';

const repoPath = process.env['CP_REPO'] ?? process.cwd();
const main = process.env['CP_MAIN'] ?? 'main';
const port = Number(process.env['CP_PORT'] ?? 4317);

const app = buildApp(repoPath, main);
app.listen({ port, host: '127.0.0.1' })
  .then(() => console.log(`control-plane API on http://127.0.0.1:${port} (repo: ${repoPath})`))
  .catch((err) => { console.error(err); process.exit(1); });
