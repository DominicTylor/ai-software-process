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
