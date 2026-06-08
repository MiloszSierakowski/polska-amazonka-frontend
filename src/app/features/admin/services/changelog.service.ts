import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ChangeLog } from '../models/change-log.model';

@Injectable({
  providedIn: 'root'
})
export class ChangeLogService {
  private readonly apiUrl: string;

  constructor(
    private http: HttpClient,
    @Inject('BACKEND_URL') backendUrl: string
  ) {
    this.apiUrl = `${backendUrl}/api/admin/changelogs`;
  }

  getAll(): Observable<ChangeLog[]> {
    return this.http.get<ChangeLog[]>(this.apiUrl);
  }
}
