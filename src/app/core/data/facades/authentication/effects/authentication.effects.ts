import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import {
  loginPage,
  loginSuccess,
  loginFailure,
  rehydrateAuth,
  rehydrateAuthSuccess,
  rehydrateAuthFailure,
  logout
} from '../actions/authentication.actions';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthenticationService } from '../services/authentication.service';
import { AlertService } from '../../../services/alert/alert.service';
import { Router } from '@angular/router';
import { AuthResponse } from '../reducers/authentication.reducers';
import { environment } from '../../../../../../environments/environment';

@Injectable()
export class AuthenticationEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthenticationService);
  private alertService = inject(AlertService);
  private router = inject(Router);

  constructor() {
    if (!environment.production) {
      console.debug('AuthenticationEffects initialized');
    }
  }

  /** Rehydrate Auth from localStorage on app init or when needed */
  hydrate$ = createEffect(() =>
    this.actions$.pipe(
      ofType(rehydrateAuth),
      tap(() => { if (!environment.production) console.debug('[Rehydrate Auth] triggered'); }),
      map(() => {
        const raw = localStorage.getItem('auth_response');
        if (!raw) return { type: '[Auth] Rehydrate Noop' } as any;
        try {
          const authResponse: AuthResponse = JSON.parse(raw);
          return rehydrateAuthSuccess({ auth_response: authResponse });
        } catch (error) {
          console.error('Rehydration Error:', error);
          localStorage.removeItem('auth_response');
          return rehydrateAuthFailure({ error: 'Corrupt session in storage' });
        }
      })
    )
  );

  /** Handle Login Request */
  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loginPage),
      tap(() => {
        if (!environment.production) {
          console.debug('[Login Page] effect triggered');
        }
      }),
      switchMap(({ endpoint, email, password }) =>
        this.authService.login(endpoint, email, password).pipe(
          map((data: AuthResponse) => loginSuccess({ auth_response: data })),
          catchError((error) => {
            console.error('Login failed:', error);
            return of(loginFailure({ error: error?.message || 'Login failed' }));
          })
        )
      )
    )
  );

  /** Handle Successful Login (Save Token & Navigate) */
  loginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(loginSuccess),
        tap(({ auth_response }) => {
          if (!environment.production) {
            console.debug('[Login Success] effect triggered');
          }

          // Save session in localStorage
          localStorage.setItem('auth_response', JSON.stringify(auth_response));

          // Redirect user
          const targetRoute = auth_response.navigate_to ? `/${auth_response.navigate_to}` : '/';

          // Check?
          setTimeout(() => {
            this.router.navigateByUrl(targetRoute).then(ok => {
              this.alertService.success('Login Successful');
            }).catch(err => console.error('navigate error', err));
          }, 0);
        })
      ),
    { dispatch: false }
  );

  /** Show Error Alert on Login Failure */
  loginError$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(loginFailure),
        tap(({ error }) => {
          if (!environment.production) {
            console.debug('[Login Error] effect triggered');
          }
          this.alertService.error(error);
        })
      ),
    { dispatch: false }
  );

  logout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(logout),
        tap(() => {
          localStorage.removeItem('auth_response');
          this.router.navigate(['/authenticate/login']);
          this.alertService.success('You have been logged out');
        })
      ),
    { dispatch: false }
  );
}
