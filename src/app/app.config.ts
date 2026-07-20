import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { csrfInterceptor } from './core/interceptors/csrf.interceptor';
import { adminToastInterceptor } from './core/interceptors/admin-toast.interceptor';
import { resolveBackendUrl } from './core/config/backend-url';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([csrfInterceptor, authInterceptor, adminToastInterceptor])),
    provideCharts(withDefaultRegisterables()),
    { provide: 'BACKEND_URL', useValue: resolveBackendUrl() }
  ]
};
