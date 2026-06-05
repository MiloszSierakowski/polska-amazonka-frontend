import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { adminToastInterceptor } from './core/interceptors/admin-toast.interceptor';

export const BACKEND_URL = 'http://localhost:8080';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, adminToastInterceptor])),
    { provide: 'BACKEND_URL', useValue: BACKEND_URL }
  ]
};
