
import { NgModule } from '@angular/core';
import {
  RouterModule,
  Routes
} from '@angular/router';

/**
 * Root application routing.
 *
 * PageRoutingModule handles application
 * URLs through the generic PageComponent.
 *
 * NestJS remains responsible for resolving
 * canonical routes, aliases and access policies.
 */
const routes: Routes = [
  {
    /**
     * Safe public entry point.
     *
     * Do not redirect to a hardcoded
     * organisation or application dashboard.
     *
     * Context-aware application startup
     * will be introduced separately.
     */
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [
    /**
     * Preserve hash routing for V1.
     *
     * Angular Router.url still exposes
     * application-relative URLs such as:
     *
     * /login
     * /crm/customers/123
     *
     * Switching to path-based URLs requires
     * appropriate server fallback configuration.
     */
    RouterModule.forRoot(routes, {
      useHash: true
    })
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule {}
