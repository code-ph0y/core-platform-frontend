
import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, map } from 'rxjs';

import {
  rehydrateAuth,
  selectOrganisation
} from './core/data/facades/authentication/actions/authentication.actions';

import {
  isAuthenticated,
  selectAvailableOrganisations,
  selectSelectedOrganisationId
} from './core/data/facades/authentication/selectors/authentication.selectors';

import { AppState } from './core/data/facades/index.facade';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: false
})
export class AppComponent {
  private readonly store = inject<Store<AppState>>(Store);

  title = 'core-platform';

  /**
   * Organisation picker state.
   *
   * Show the picker only when:
   * - The user is authenticated.
   * - The user belongs to multiple organisations.
   */
  readonly organisationPicker$ = combineLatest({
    authenticated: this.store.select(isAuthenticated),
    organisations: this.store.select(selectAvailableOrganisations),
    selectedOrganisationId: this.store.select(selectSelectedOrganisationId)
  }).pipe(
    map(({ authenticated, organisations, selectedOrganisationId }) => ({
      show: authenticated && organisations.length > 1,
      organisations,
      selectedOrganisationId: selectedOrganisationId ?? ''
    }))
  );

  constructor() {
    // Restore authentication state on application startup.
    this.store.dispatch(rehydrateAuth());
  }

  /**
   * Select an organisation using the existing
   * authenticated organisation validation.
   */
  selectOrganisation(organisationId: string): void {
    if (!organisationId) {
      return;
    }

    this.store.dispatch(
      selectOrganisation({ organisationId })
    );
  }
}
