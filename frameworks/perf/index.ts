// Perf framework (k6) — bilateral contract surface for performance scenarios.
// Mirrors the e2e framework: scenarios consume verbs; helpers hold the route shapes
// the code perimeter must expose. Execution is wired in slice 2 (workers).
//
// Example consumer (stories/<...>/perf/<scenario>.k6.ts):
//   import { perfClient } from '@canon/perf-framework';
//   export default function () { perfClient.runLoginRequest(); }

export interface PerfClient {
  runLoginRequest(): void;
}

export const perfClient: PerfClient = {
  runLoginRequest() {
    throw new Error('perf verbs are implemented per project; see frameworks/perf/README.md');
  },
};
