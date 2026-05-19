import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AdminUser } from '../models/admin-user.model';

@Injectable({
  providedIn: 'root'
})
export class AdminUserService {
  constructor(
    private http: HttpClient,
    @Inject('BACKEND_URL') private backendUrl: string
  ) {}

  getUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.backendUrl}/api/admin/users`);
  }
}
