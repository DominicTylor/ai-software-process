import { BasePersona } from './base-persona';

/**
 * Invariant-check persona — walks the system looking for forbidden patterns
 * and returns counts. Scenarios assert the count is whatever the invariant
 * requires (typically zero).
 */
export class Probe extends BasePersona {
  async scanForPasswordInputs(paths: string[]): Promise<number> {
    let count = 0;
    for (const path of paths) {
      await this.page.goto(path);
      count += await this.page.locator('input[type="password"]').count();
    }
    return count;
  }
}
