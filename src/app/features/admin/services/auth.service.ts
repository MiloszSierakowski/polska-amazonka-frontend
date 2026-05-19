import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { LoginResponse } from '../models/admin-user.model';

const TOKEN_KEY = 'pa_admin_token';
const LOGIN_KEY = 'pa_admin_login';
const ROLE_KEY = 'pa_admin_role';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(
    private http: HttpClient,
    @Inject('BACKEND_URL') private backendUrl: string
  ) {}

  login(login: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.backendUrl}/api/auth/login`, { login, password })
      .pipe(
        tap((response) => {
          localStorage.setItem(TOKEN_KEY, response.token);
          localStorage.setItem(LOGIN_KEY, response.login);
          localStorage.setItem(ROLE_KEY, response.role);
        })
      );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LOGIN_KEY);
    localStorage.removeItem(ROLE_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getLogin(): string | null {
    return localStorage.getItem(LOGIN_KEY);
  }

  getRole(): string | null {
    return localStorage.getItem(ROLE_KEY);
  }

  isAdmin(): boolean {
    return this.getRole() === 'ADMIN';
  }
}
