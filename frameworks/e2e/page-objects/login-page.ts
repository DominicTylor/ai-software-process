import type { Page } from '@playwright/test';

/**
 * Holds selectors for the login screen and exposes screen-level actions.
 * The data-testid strings here ARE the bilateral contract end facing the
 * code perimeter — the demo (and, in adopter projects, the real product)
 * must render exactly these attributes.
 */
export class LoginPage {
  constructor(private page: Page) {}

  async open() {
    await this.page.goto('/');
  }

  async entersEmail(email: string) {
    await this.page.fill('[data-testid="login-email"]', email);
  }

  async clicksContinueWithMagicLink() {
    await this.page.click('[data-testid="login-continue-magic"]');
  }
}
