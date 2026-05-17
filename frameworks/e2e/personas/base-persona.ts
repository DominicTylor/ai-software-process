import type { Page } from '@playwright/test';

/**
 * Base class for all personas. Holds the Playwright `Page` and provides a
 * memoized factory for PageObjects so each PageObject is instantiated at most
 * once per persona lifetime (i.e. once per test).
 *
 * Adopters extend BasePersona to add their own personas (admin, tenant, etc.)
 * and use `this.pageObject(SomePage)` to delegate to a PageObject method.
 */
export abstract class BasePersona {
  private pageObjects = new Map<unknown, unknown>();

  constructor(protected page: Page) {}

  /** Memoized PageObject access. */
  protected pageObject<T>(Ctor: new (page: Page) => T): T {
    let instance = this.pageObjects.get(Ctor) as T | undefined;
    if (!instance) {
      instance = new Ctor(this.page);
      this.pageObjects.set(Ctor, instance);
    }
    return instance;
  }
}
