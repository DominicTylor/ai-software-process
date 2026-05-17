import { BasePersona } from './base-persona';
import { LoginPage } from '../page-objects/login-page';
import { DashboardPage } from '../page-objects/dashboard-page';

/**
 * Canonical happy-path persona. Adopters typically extend this with verbs
 * specific to their product (e.g. user.createsWorkspace(), user.invitesTeammate()),
 * each delegating to a PageObject method.
 */
export class User extends BasePersona {
  async opensLoginPage() {
    return this.pageObject(LoginPage).open();
  }

  async entersEmail(email: string) {
    return this.pageObject(LoginPage).entersEmail(email);
  }

  async clicksContinueWithMagicLink() {
    return this.pageObject(LoginPage).clicksContinueWithMagicLink();
  }

  async expectsDashboard() {
    return this.pageObject(DashboardPage).expectsVisible();
  }
}
