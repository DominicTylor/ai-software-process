import { test } from '@canon/e2e-framework';

test('Attacker cannot reach a hidden admin path', async ({ attacker }) => {
  // # Attacker tries a likely-sensitive admin URL
  await attacker.attemptsToNavigateTo('/admin.html');

  // # System returns 404 — no admin area is exposed publicly
  await attacker.expectsLastResponseWas404();
});
