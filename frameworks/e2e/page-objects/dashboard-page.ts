import { expect, type Page } from '@playwright/test';

/**
 * Holds selectors for the dashboard screen. Same bilateral-contract role
 * as LoginPage — data-testid strings here are what the code perimeter
 * must render.
 */
export class DashboardPage {
  constructor(private page: Page) {}

  async expectsVisible() {
    await expect(this.page.locator('[data-testid="dashboard-title"]')).toBeVisible();
  }
}
