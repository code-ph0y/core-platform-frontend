import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, throwError, Subject } from 'rxjs';
import { catchError, debounceTime } from 'rxjs/operators';
import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { AlertService } from '../../../services/alert/alert.service';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  private navigateToLogin$ = new Subject<void>();

  constructor(
    private router: Router,
    private alertService: AlertService,
    private zone: NgZone
  ) {
    // Set up debounced navigation
    this.navigateToLogin$.pipe(
      debounceTime(100)
    ).subscribe(() => {
      if (!this.router.url.startsWith('/authenticate/login')) {
        this.router.navigate(['/authenticate/login']);
      }
    });
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'An unexpected error occurred';

        this.zone.run(() => {
          this.alertService.clear();

          switch (error.status) {
            case 401:
            case 403: {
              const msg = error?.error?.message;
              if (msg === 'Expired JWT Token') {
                errorMessage = 'Your session has expired. Please log in again.';
              } else if (msg === 'JWT Token not found') {
                errorMessage = 'Authentication token not found. Please log in.';
              } else if (msg === 'Invalid JWT Token') {
                errorMessage = 'Invalid authentication token. Please log in again.';
              } else if (msg === 'Invalid credentials.') {
                errorMessage = 'Invalid username or password.';
              } else {
                errorMessage = msg || 'Authentication error';
              }
              console.log(errorMessage);
              // clear session + navigate
              localStorage.removeItem('auth_response');
              this.navigateToLogin$.next();
              break;
            }

            case 404: errorMessage = 'The requested resource could not be found.'; break;
            case 422: errorMessage = error.error?.message || 'Validation error. Please check your input.'; break;
            case 429: errorMessage = 'Too many requests. Please wait a moment and try again.'; break;
            case 500: errorMessage = 'Internal server error. Please try again later.'; break;
            case 502: errorMessage = 'Bad gateway. The server is temporarily unavailable.'; break;
            case 503: errorMessage = 'Service unavailable. The server is currently unable to handle the request.'; break;
            case 504: errorMessage = 'Gateway timeout. The server took too long to respond.'; break;
            default:  errorMessage = error.error?.message || error.statusText || errorMessage; break;
          }

          // Show alert unless we redirected to login (login page will show its own UI)
          if (this.router.url.startsWith('/authenticate/login')) {
            // avoid duplicate alerts on the login page from a 401 cycle
          } else if (error.status !== 401 && error.status !== 403) {
            this.alertService.error(errorMessage);
          }
        });

        // keep original error object for downstream effects/selectors
        (error as any).userMessage = errorMessage;
        return throwError(() => error);
      })
    );
  }
}
