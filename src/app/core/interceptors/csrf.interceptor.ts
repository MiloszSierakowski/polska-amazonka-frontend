import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../../features/admin/services/auth.service';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
const CSRF_HEADER_NAME = 'X-XSRF-TOKEN';
const CSRF_ERROR_CODE = 'CSRF_TOKEN_INVALID';
const CSRF_RETRY_ATTEMPTED = new HttpContextToken<boolean>(() => false);

export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  if (!authService.isBackendRequest(req.url)) {
    return next(req);
  }

  if (!MUTATING_METHODS.has(req.method.toUpperCase())) {
    return next(req.clone({ withCredentials: true }));
  }

  const requestWithCurrentToken = (retryAttempted: boolean) => {
    const csrfToken = readCookie(CSRF_COOKIE_NAME);
    return req.clone({
      withCredentials: true,
      context: req.context.set(CSRF_RETRY_ATTEMPTED, retryAttempted),
      setHeaders: csrfToken ? { [CSRF_HEADER_NAME]: csrfToken } : {}
    });
  };

  const sendWithSingleRetry = () => {
    return next(requestWithCurrentToken(false)).pipe(
      catchError((error: HttpErrorResponse) => {
        if (!isCsrfFailure(error)) {
          return throwError(() => error);
        }
        return authService.initializeCsrf().pipe(
          switchMap(() => next(requestWithCurrentToken(true)))
        );
      })
    );
  };

  if (readCookie(CSRF_COOKIE_NAME)) {
    if (req.context.get(CSRF_RETRY_ATTEMPTED)) {
      return next(requestWithCurrentToken(true));
    }
    return sendWithSingleRetry();
  }

  return authService.initializeCsrf().pipe(
    switchMap(() => sendWithSingleRetry())
  );
};

function isCsrfFailure(error: HttpErrorResponse): boolean {
  return error.status === 403 && error.error?.errorCode === CSRF_ERROR_CODE;
}

function readCookie(name: string): string | null {
  const prefix = `${encodeURIComponent(name)}=`;
  const cookie = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));

  return cookie ? decodeURIComponent(cookie.substring(prefix.length)) : null;
}
