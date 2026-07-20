import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { defer, of } from 'rxjs';
import { AuthService } from '../../features/admin/services/auth.service';
import { csrfInterceptor } from './csrf.interceptor';

describe('csrfInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    clearCsrfCookie();
    authService = jasmine.createSpyObj<AuthService>('AuthService', [
      'initializeCsrf',
      'isBackendRequest'
    ]);
    authService.isBackendRequest.and.callFake((url) => url.startsWith('/api/'));
    authService.initializeCsrf.and.returnValue(of({}));

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([csrfInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authService }
      ]
    });

    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    clearCsrfCookie();
  });

  it('adds the current CSRF token only to backend mutations', () => {
    setCsrfCookie('current-token');

    http.post('/api/test', {}).subscribe();

    const request = httpTesting.expectOne('/api/test');
    expect(request.request.withCredentials).toBeTrue();
    expect(request.request.headers.get('X-XSRF-TOKEN')).toBe('current-token');
    request.flush({});
  });

  it('does not add the CSRF header to GET requests', () => {
    setCsrfCookie('current-token');

    http.get('/api/test').subscribe();

    const request = httpTesting.expectOne('/api/test');
    expect(request.request.withCredentials).toBeTrue();
    expect(request.request.headers.has('X-XSRF-TOKEN')).toBeFalse();
    request.flush({});
  });

  it('does not send credentials or the CSRF token to external addresses', () => {
    setCsrfCookie('current-token');

    http.post('https://external.example/test', {}).subscribe();

    const request = httpTesting.expectOne('https://external.example/test');
    expect(request.request.withCredentials).toBeFalse();
    expect(request.request.headers.has('X-XSRF-TOKEN')).toBeFalse();
    request.flush({});
  });

  it('refreshes an invalid CSRF token and retries the mutation exactly once', () => {
    setCsrfCookie('expired-token');
    authService.initializeCsrf.and.callFake(() => defer(() => {
      setCsrfCookie('fresh-token');
      return of({});
    }));

    http.post('/api/test', {}).subscribe((response) => expect(response).toEqual({ saved: true }));

    const firstRequest = httpTesting.expectOne('/api/test');
    expect(firstRequest.request.headers.get('X-XSRF-TOKEN')).toBe('expired-token');
    firstRequest.flush(
      { errorCode: 'CSRF_TOKEN_INVALID' },
      { status: 403, statusText: 'Forbidden' }
    );

    const retriedRequest = httpTesting.expectOne('/api/test');
    expect(retriedRequest.request.headers.get('X-XSRF-TOKEN')).toBe('fresh-token');
    retriedRequest.flush({ saved: true });

    expect(authService.initializeCsrf).toHaveBeenCalledTimes(1);
  });

  it('does not retry a mutation more than once after a second CSRF failure', () => {
    setCsrfCookie('expired-token');
    authService.initializeCsrf.and.callFake(() => defer(() => {
      setCsrfCookie('fresh-token');
      return of({});
    }));
    let receivedStatus: number | undefined;

    http.post('/api/test', {}).subscribe({
      error: (error) => receivedStatus = error.status
    });

    httpTesting.expectOne('/api/test').flush(
      { errorCode: 'CSRF_TOKEN_INVALID' },
      { status: 403, statusText: 'Forbidden' }
    );
    httpTesting.expectOne('/api/test').flush(
      { errorCode: 'CSRF_TOKEN_INVALID' },
      { status: 403, statusText: 'Forbidden' }
    );

    expect(receivedStatus).toBe(403);
    expect(authService.initializeCsrf).toHaveBeenCalledTimes(1);
  });

  it('initializes CSRF before the first mutation when the cookie is missing', () => {
    authService.initializeCsrf.and.callFake(() => defer(() => {
      setCsrfCookie('initialized-token');
      return of({});
    }));

    http.delete('/api/test').subscribe();

    const request = httpTesting.expectOne('/api/test');
    expect(request.request.headers.get('X-XSRF-TOKEN')).toBe('initialized-token');
    request.flush({});
    expect(authService.initializeCsrf).toHaveBeenCalledTimes(1);
  });
});

function setCsrfCookie(value: string): void {
  document.cookie = `XSRF-TOKEN=${encodeURIComponent(value)}; Path=/`;
}

function clearCsrfCookie(): void {
  document.cookie = 'XSRF-TOKEN=; Max-Age=0; Path=/';
}
