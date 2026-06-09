import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { isAdminAreaPath } from '../admin/admin-route.util';
import { parseApiError } from '../admin/api-error.util';
import { ToastService } from '../admin/toast.service';

interface ApiErrorBody {
  errorCode?: string;
}

export const adminToastInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const toastService = inject(ToastService);

  if (!isAdminAreaPath(router.url)) {
    return next(req);
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (shouldShowToast(error, req.method, req.url)) {
        const parsed = parseApiError(error);
        if (parsed.type === 'warning') {
          toastService.warning(parsed.message);
        } else {
          toastService.error(parsed.message);
        }
      }
      return throwError(() => error);
    })
  );
};

function shouldShowToast(error: HttpErrorResponse, method: string, url: string): boolean {
  if (shouldSkipHandledAdminError(error, method, url)) {
    return false;
  }
  if (error.status === 0) {
    return true;
  }
  const normalizedMethod = method.toUpperCase();
  if (normalizedMethod !== 'GET') {
    return true;
  }
  return error.status === 401 || error.status === 403 || error.status >= 500;
}

function shouldSkipHandledAdminError(error: HttpErrorResponse, method: string, url: string): boolean {
  const body = (error.error ?? {}) as ApiErrorBody;
  if (body.errorCode === 'SHOP_CATEGORY_LOCKED') {
    return true;
  }
  if (method.toUpperCase() === 'DELETE' && /\/api\/shops\/\d+$/.test(url) && error.status === 400) {
    return true;
  }
  if (method.toUpperCase() === 'POST' && /\/api\/admin\/users$/.test(url)) {
    return true;
  }
  return false;
}
