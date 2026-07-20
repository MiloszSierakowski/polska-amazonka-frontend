import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../../features/admin/services/auth.service';

export const adminAuthGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  return authService.restoreSession().pipe(
    map((active) => active
      ? true
      : router.createUrlTree(['/admin/login']))
  );
};
