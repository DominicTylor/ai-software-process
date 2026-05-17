import { test, expect } from '@canon/e2e-framework';

test('No public page exposes a password input', async ({ probe }) => {
  // # Probe visits every public page and counts password inputs across all forms
  const count = await probe.scanForPasswordInputs(['/', '/dashboard.html']);

  // # Count must be zero — passwords are not part of any auth flow
  expect(count).toBe(0);
});
