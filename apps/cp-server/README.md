# Control Plane (slice 1)

Read-only delivery control plane: a view over the master repo's git + artifacts.

## Run

    pnpm cp:build
    CP_REPO="/path/to/master-repo" pnpm --filter @canon/cp-server exec tsx src/main.ts
    # open http://127.0.0.1:4317

Env: `CP_REPO` (default: cwd), `CP_MAIN` (default: `main`), `CP_PORT` (default: 4317).

## Dev (HMR)

    pnpm cp:server   # API on :4317
    pnpm cp:dev      # Vite on :5173, proxies /api -> :4317

## Scope

Slice 1 derives state from local git + files only. PR/CI/approvals (forge) and
test execution are out of scope and reported as `unknown` — added in slices 2-3.

## Runs / execution (slice 2)

Trigger processes in the target repo and stream their output live.

- `POST /api/runs` `{ "type": "e2e" | "typecheck" | "agent" | "custom", "file"?, "args"? }` → `201 { id }`
  - `e2e` → `pnpm test:e2e`, `typecheck` → `pnpm typecheck`, `agent` → `$CP_AGENT_CMD` (default `claude`), `custom` → `{ file, args }`
- `GET /api/runs` → `{ runs: RunSummary[] }`
- `GET /api/runs/:id` → run detail incl. buffered `output`
- `POST /api/runs/:id/stop` → kill the run

Live streaming over socket.io: connect with `?run=<id>`; server emits `output` (string) and `exit` (code); client emits `input` (stdin) and `resize` `{cols,rows}`. The UI renders this in an xterm.js terminal; interactive agents (Claude/Codex) work via the PTY's stdin.

Runs execute in `CP_REPO`'s current checkout. `CP_AGENT_CMD` overrides the agent command (default `claude`). Local run results are advisory; the canonical "tests passed" gate is CI on the PR (slice 3).
