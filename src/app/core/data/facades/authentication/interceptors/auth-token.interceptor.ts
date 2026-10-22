import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthTokenInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const raw = localStorage.getItem('auth_response');

    if (!raw) {
      return next.handle(req);
    }

    let accessToken: string | null = null;

    try {
      const parsed = JSON.parse(raw);
      accessToken = parsed?.access_token ?? null;
    } catch {
      accessToken = null;
    }

    if (!accessToken) {
      return next.handle(req);
    }

    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return next.handle(authReq);
  }
}
