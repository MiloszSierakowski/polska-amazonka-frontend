import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AdminUser,
  CreateAdminUserPayload,
  ResetUserPasswordResponse,
  UpdateUserBlockedPayload
} from '../models/admin-user.model';

@Injectable({
  providedIn: 'root'
})
export class AdminUserService {
  private readonly apiUrl: string;

  constructor(
    private http: HttpClient,
    @Inject('BACKEND_URL') backendUrl: string
  ) {
    this.apiUrl = `${backendUrl}/api/admin/users`;
  }

  getUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(this.apiUrl);
  }

  create(payload: CreateAdminUserPayload): Observable<AdminUser> {
    return this.http.post<AdminUser>(this.apiUrl, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  setBlocked(id: number, payload: UpdateUserBlockedPayload): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.apiUrl}/${id}/blocked`, payload);
  }

  resetPassword(id: number): Observable<ResetUserPasswordResponse> {
    return this.http.post<ResetUserPasswordResponse>(`${this.apiUrl}/${id}/password-reset`, {});
  }
}
