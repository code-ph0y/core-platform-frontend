
import { NgModule } from '@angular/core';

import {
  RouterModule,
  Routes
} from '@angular/router';

import { PageComponent } from './page.component';

/**
 * Core Platform V1 page routing.
 *
 * All application pages are metadata-driven.
 *
 * Angular is responsible for activating
 * the generic page renderer.
 *
 * NestJS is responsible for:
 *
 * - Resolving browser URLs
 * - Identifying the owning application
 * - Identifying the stable page ID
 * - Validating route parameters
 * - Resolving canonical redirects
 * - Enforcing authentication
 * - Verifying organisation membership
 * - Enforcing application access
 * - Filtering page permissions
 *
 * No individual application routes are
 * hardcoded in Angular.
 */
const routes: Routes = [
  {
    /**
     * Match all application browser URLs.
     *
     * Examples:
     *
     * /login
     * /dashboard
     * /crm/customers
     * /crm/customers/123
     * /crm/clients/123
     *
     * RouterEffects resolves each URL through
     * the authorized NestJS routing API.
     *
     * A URL matching this Angular route does
     * not mean the user is authorized to access
     * the corresponding application page.
     *
     * The page definition must only be loaded
     * after authorized route resolution.
     *
     * Unknown or unauthorized URLs must not
     * display a previously loaded page.
     */
    path: '**',
    component: PageComponent
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [
    RouterModule
  ]
})
export class PageRoutingModule {}
