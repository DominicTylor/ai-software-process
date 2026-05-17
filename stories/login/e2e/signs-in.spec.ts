import { test } from '@canon/e2e-framework';

test('User signs in via magic link', async ({ user }) => {
  // # User opens the login page
  await user.opensLoginPage();

  // # User enters their email
  await user.entersEmail('alice@example.com');

  // # User clicks "Continue with magic link"
  await user.clicksContinueWithMagicLink();

  // # System shows the dashboard
  await user.expectsDashboard();
});
