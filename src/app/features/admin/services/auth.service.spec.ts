import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService,
        { provide: 'BACKEND_URL', useValue: '' }
      ]
    });
    service = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    sessionStorage.clear();
  });

  it('fetches a fresh CSRF token after login before completing authentication', () => {
    let completed = false;

    service.login('admin', 'password').subscribe(() => completed = true);

    const initialCsrf = httpTesting.expectOne('/api/auth/csrf');
    expect(initialCsrf.request.withCredentials).toBeTrue();
    initialCsrf.flush({ initialized: true });

    const login = httpTesting.expectOne('/api/auth/login');
    expect(completed).toBeFalse();
    login.flush({
      id: 1,
      login: 'admin',
      role: 'ADMIN',
      firstName: null,
      lastName: null,
      email: null
    });

    const refreshedCsrf = httpTesting.expectOne('/api/auth/csrf');
    expect(completed).toBeFalse();
    expect(refreshedCsrf.request.withCredentials).toBeTrue();
    refreshedCsrf.flush({ initialized: true });

    expect(completed).toBeTrue();
    expect(sessionStorage.getItem('pa_admin_login')).toBe('admin');
  });
});
