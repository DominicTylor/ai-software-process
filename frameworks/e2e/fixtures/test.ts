import { test as base, expect } from '@playwright/test';
import { User } from '../personas/user';
import { Attacker } from '../personas/attacker';
import { Probe } from '../personas/probe';

export type Personas = {
  user: User;
  attacker: Attacker;
  probe: Probe;
};

/**
 * The framework's `test` — Playwright's base test extended with the three
 * canonical personas. Stories import this and destructure whichever
 * personas they need: `test('...', async ({ user }) => { ... })`.
 *
 * Adopters extend with their own personas by re-extending:
 *   import { test as base } from '@canon/e2e-framework';
 *   export const test = base.extend<{ admin: Admin }>({ admin: ... });
 */
export const test = base.extend<Personas>({
  user:     async ({ page }, use) => { await use(new User(page)); },
  attacker: async ({ page }, use) => { await use(new Attacker(page)); },
  probe:    async ({ page }, use) => { await use(new Probe(page)); },
});

export { expect };
