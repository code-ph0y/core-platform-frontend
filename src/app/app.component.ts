import { Component } from '@angular/core';
import { Store } from '@ngrx/store';

import { rehydrateAuth } from './core/data/facades/authentication/actions/authentication.actions';
import { AppState } from './core/data/facades/index.facade';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: false
})
export class AppComponent {
  title = 'core-platform';

  constructor(
    private store: Store<AppState>
  ) {
    // Rehydrate auth state from localStorage before any route guards run
    this.store.dispatch(rehydrateAuth());
  }
}
