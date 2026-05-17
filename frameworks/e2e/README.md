# @canon/e2e-framework

Playwright-based e2e framework for the AI-Native Software Delivery process. Provides the user-action vocabulary Story-owned scenarios consume (`user.X()`, `attacker.Y()`, `probe.Z()`) and holds the bilateral contract between scenarios (master perimeter) and the UI surfaces under test (code perimeter) via PageObjects whose `data-testid` selectors the code-perimeter implementation must honor.

See [`../../process.md`](../../process.md) § Frameworks and the design spec at [`../../docs/specs/2026-05-17-e2e-framework-design.md`](../../docs/specs/2026-05-17-e2e-framework-design.md).

## Quickstart

```bash
pnpm install
pnpm install:browsers
pnpm test:e2e
```

The suite starts the demo (`@canon/demo`) on `http://localhost:8080` automatically (via Playwright's `webServer` config) and runs all scenarios under `stories/**/{e2e,security,a11y}/*.spec.ts`.

## Layout

- `personas/` — `BasePersona` + the three canonical personas (`User`, `Attacker`, `Probe`)
- `page-objects/` — one file per screen; selectors live here and nowhere else
- `fixtures/test.ts` — Playwright `test` extended with the three personas
- `index.ts` — package facade; adopters and Stories import from here

## Adding a new verb

A new verb either belongs to an existing persona on an existing screen, or it touches a screen the framework does not yet know about. Either way, the bilateral contract requires the selector to live in a PageObject.

1. If the screen exists, add a method to its PageObject (with the explicit `data-testid` selector).
2. If the screen is new, create a new PageObject in `page-objects/<screen>.ts`.
3. Add the persona method (e.g. `user.X()`) that delegates: `return this.pageObject(SomePage).x();`
4. Re-export the new PageObject from `index.ts` if adopters might extend it.

## Adding a new persona

Adopters extend `BasePersona` and re-extend the fixture:

```ts
// your-frameworks/e2e/personas/admin.ts
import { BasePersona } from '@canon/e2e-framework';
import { AdminUsersPage } from '../page-objects/admin-users-page';

export class Admin extends BasePersona {
  async deletesUser(id: string) {
    return this.pageObject(AdminUsersPage).clicksDeleteForRow(id);
  }
}

// your-frameworks/e2e/fixtures/test.ts
import { test as base, expect } from '@canon/e2e-framework';
import { Admin } from '../personas/admin';

export const test = base.extend<{ admin: Admin }>({
  admin: async ({ page }, use) => { await use(new Admin(page)); },
});

export { expect };
```

Stories then import `from 'your-frameworks/e2e'` and receive `{ user, attacker, probe, admin }`.

## Conventions

- **test-id naming**: kebab-case with component prefix (`login-email`, `dashboard-logout`, `admin-users-row-delete`). Never bare names that could collide across screens.
- **PageObject = one screen**. No composite "AuthFlow" PageObjects; split if one grows past ~10 methods.
- **Persona methods are first-person verbs** of the persona: `user.entersEmail`, `attacker.attemptsToNavigateTo`, `probe.scanForPasswordInputs`. Not `loginUser` (that frames it as "framework does X to user" rather than "user does X").
- **Selector strings only in PageObjects.** Never in personas. Never in tests. (Enforced by `quality-spec` agent in PR review.)

## What this framework does NOT do

- No raw `Page` access from tests — if you reach for it, that's a missing PageObject method or persona verb; fix the framework.
- No global / `beforeAll` login. Each test is isolated; if a scenario needs logged-in state, the scenario expresses it.
- No cross-browser projects by default — chromium only. Adopters extend `projects[]` in `playwright.config.ts` if they need firefox/webkit.
- No visual regression / screenshot diffing. Add separately if needed.
