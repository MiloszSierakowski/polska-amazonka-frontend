import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../../features/admin/services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isBackendRequest(req.url)) {
    req = req.clone({
      withCredentials: true
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && authService.isBackendRequest(req.url)) {
        authService.clearLocalSession();
        if (router.url !== '/admin/login') {
          void router.navigate(['/admin/login']);
        }
      }
      return throwError(() => error);
    })
  );
};
