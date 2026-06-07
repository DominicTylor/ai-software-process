# Perf framework (k6)

Performance gates for Stories. Scenarios live at `stories/<...>/perf/<scenario>.k6.ts`
and are **optional** per Story (the control plane treats a missing `perf/` folder as N/A,
a present-but-todo scenario as scaffold, and an implemented scenario as ready).

Execution (running k6, collecting thresholds) is delivered in slice 2 alongside the
e2e/worker execution layer. This package currently provides the contract surface only.
