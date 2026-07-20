import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable, catchError, finalize, map, of, switchMap, tap } from 'rxjs';
import { LoginResponse, UserProfile } from '../models/admin-user.model';

const ID_KEY = 'pa_admin_id';
const LOGIN_KEY = 'pa_admin_login';
const ROLE_KEY = 'pa_admin_role';
const FIRST_NAME_KEY = 'pa_admin_first_name';
const LAST_NAME_KEY = 'pa_admin_last_name';
const EMAIL_KEY = 'pa_admin_email';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(
    private http: HttpClient,
    @Inject('BACKEND_URL') private backendUrl: string
  ) {}

  login(login: string, password: string): Observable<LoginResponse> {
    return this.initializeCsrf().pipe(
      switchMap(() => this.http.post<LoginResponse>(
        `${this.backendUrl}/api/auth/login`,
        { login, password }
      )),
      switchMap((response) => this.initializeCsrf().pipe(map(() => response))),
      tap((response) => this.persistSession(response))
    );
  }

  clearLocalSession(): void {
    this.clearSession();
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.backendUrl}/api/auth/logout`, {}).pipe(
      finalize(() => this.clearSession())
    );
  }

  isLoggedIn(): boolean {
    return this.getProfileSnapshot() !== null;
  }

  restoreSession(): Observable<boolean> {
    return this.http.get<UserProfile>(`${this.backendUrl}/api/users/profile`).pipe(
      tap((profile) => this.updateProfileState(profile)),
      map(() => true),
      catchError(() => {
        this.clearSession();
        return of(false);
      })
    );
  }

  isBackendRequest(url: string): boolean {
    const normalizedBackendUrl = this.backendUrl.replace(/\/+$/, '');
    return url.startsWith('/api/')
      || (normalizedBackendUrl !== '' && url.startsWith(`${normalizedBackendUrl}/api/`));
  }

  initializeCsrf(): Observable<unknown> {
    return this.http.get(`${this.backendUrl}/api/auth/csrf`, { withCredentials: true });
  }

  getUserId(): number | null {
    const raw = sessionStorage.getItem(ID_KEY);
    if (!raw) {
      return null;
    }
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }

  getLogin(): string | null {
    return sessionStorage.getItem(LOGIN_KEY);
  }

  getRole(): string | null {
    return sessionStorage.getItem(ROLE_KEY);
  }

  getFirstName(): string | null {
    return sessionStorage.getItem(FIRST_NAME_KEY);
  }

  getLastName(): string | null {
    return sessionStorage.getItem(LAST_NAME_KEY);
  }

  getEmail(): string | null {
    return sessionStorage.getItem(EMAIL_KEY);
  }

  getProfileSnapshot(): UserProfile | null {
    const id = this.getUserId();
    const login = this.getLogin();
    const role = this.getRole();
    if (id == null || !login || !role) {
      return null;
    }
    return {
      id,
      login,
      role: role as UserProfile['role'],
      firstName: this.getFirstName(),
      lastName: this.getLastName(),
      email: this.getEmail()
    };
  }

  updateProfileState(profile: UserProfile): void {
    sessionStorage.setItem(ID_KEY, String(profile.id));
    sessionStorage.setItem(LOGIN_KEY, profile.login);
    sessionStorage.setItem(ROLE_KEY, profile.role);
    this.setOptionalStorage(FIRST_NAME_KEY, profile.firstName);
    this.setOptionalStorage(LAST_NAME_KEY, profile.lastName);
    this.setOptionalStorage(EMAIL_KEY, profile.email);
  }

  isAdmin(): boolean {
    return this.getRole() === 'ADMIN';
  }

  canAccessPanel(): boolean {
    const role = this.getRole();
    return this.isLoggedIn() && (role === 'ADMIN' || role === 'WORKER');
  }

  private clearSession(): void {
    sessionStorage.removeItem(ID_KEY);
    sessionStorage.removeItem(LOGIN_KEY);
    sessionStorage.removeItem(ROLE_KEY);
    sessionStorage.removeItem(FIRST_NAME_KEY);
    sessionStorage.removeItem(LAST_NAME_KEY);
    sessionStorage.removeItem(EMAIL_KEY);
  }

  private persistSession(response: LoginResponse): void {
    sessionStorage.setItem(ID_KEY, String(response.id));
    sessionStorage.setItem(LOGIN_KEY, response.login);
    sessionStorage.setItem(ROLE_KEY, response.role);
    this.setOptionalStorage(FIRST_NAME_KEY, response.firstName);
    this.setOptionalStorage(LAST_NAME_KEY, response.lastName);
    this.setOptionalStorage(EMAIL_KEY, response.email);
  }

  private setOptionalStorage(key: string, value: string | null): void {
    if (value == null || value === '') {
      sessionStorage.removeItem(key);
      return;
    }
    sessionStorage.setItem(key, value);
  }
}
