
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';

import { Injectable, NgZone } from '@angular/core';
import { Store } from '@ngrx/store';

import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AlertService } from '../../../services/alert/alert.service';
import { logout } from '../actions/authentication.actions';
import { IS_LOGIN_REQUEST } from '../services/authentication.service';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {

  constructor(
    private readonly alertService: AlertService,
    private readonly zone: NgZone,
    private readonly store: Store
  ) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'An unexpected error occurred';

        this.zone.run(() => {
          this.alertService.clear();

          const backendMessage = error.error?.message;

          const message = Array.isArray(backendMessage)
            ? backendMessage.join(', ')
            : typeof backendMessage === 'string'
              ? backendMessage
              : null;

          switch (error.status) {
            case 401: {
              switch (message) {
                case 'Expired JWT Token':
                  errorMessage =
                    'Your session has expired. Please log in again.';
                  break;

                case 'JWT Token not found':
                  errorMessage =
                    'Authentication token not found. Please log in.';
                  break;

                case 'Invalid JWT Token':
                  errorMessage =
                    'Invalid authentication token. Please log in again.';
                  break;

                case 'Invalid credentials.':
                  errorMessage = 'Invalid username or password.';
                  break;

                default:
                  errorMessage =
                    message || 'Authentication required.';
              }

              // Login requests are explicitly marked by HttpContext.
              // Their 401 responses must not trigger global logout.
              const isLoginRequest =
                req.context.get(IS_LOGIN_REQUEST);

              if (!isLoginRequest) {
                // Reset NgRx authentication state and navigate to login.
                this.store.dispatch(logout());
              }

              break;
            }

            case 403:
              // Permission denied: preserve authentication.
              errorMessage =
                message ||
                'You do not have permission to access this resource.';
              break;

            case 404:
              errorMessage =
                'The requested resource could not be found.';
              break;

            case 422:
              errorMessage =
                message ||
                'Validation error. Please check your input.';
              break;

            case 429:
              errorMessage =
                'Too many requests. Please wait a moment and try again.';
              break;

            case 500:
              errorMessage =
                'Internal server error. Please try again later.';
              break;

            case 502:
              errorMessage =
                'Bad gateway. The server is temporarily unavailable.';
              break;

            case 503:
              errorMessage =
                'Service unavailable. The server is currently unable to handle the request.';
              break;

            case 504:
              errorMessage =
                'Gateway timeout. The server took too long to respond.';
              break;

            default:
              errorMessage =
                message || error.statusText || errorMessage;
              break;
          }

          // Login failures are handled by AuthenticationEffects.
          // All other errors, including 403, are displayed.
          if (
            error.status !== 401 ||
            !req.context.get(IS_LOGIN_REQUEST)
          ) {
            if (error.status !== 401) {
              this.alertService.error(errorMessage);
            }
          }
        });

        // Preserve the original error for downstream NgRx effects.
        (error as any).userMessage = errorMessage;

        return throwError(() => error);
      })
    );
  }
}
