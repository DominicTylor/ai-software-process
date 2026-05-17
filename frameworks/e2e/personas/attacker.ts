import { expect, type Response } from '@playwright/test';
import { BasePersona } from './base-persona';

/**
 * Adversarial-flow persona. Holds the last response it produced so scenarios
 * can express two natural-language steps (try, then assert response) without
 * leaking Response-handling into the scenario body.
 */
export class Attacker extends BasePersona {
  private lastResponse: Response | null = null;

  async attemptsToNavigateTo(path: string) {
    this.lastResponse = await this.page.goto(path, { waitUntil: 'load' });
  }

  async expectsLastResponseWas404() {
    expect(this.lastResponse?.status()).toBe(404);
  }
}
