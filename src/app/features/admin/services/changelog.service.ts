import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ChangeLog } from '../models/change-log.model';

export interface ChangeLogFilters {
  userId?: number | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
}

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

  getAll(filters: ChangeLogFilters = {}): Observable<ChangeLog[]> {
    let params = new HttpParams();
    if (filters.userId != null) {
      params = params.set('userId', String(filters.userId));
    }
    if (filters.startDate) {
      params = params.set('startDate', this.toLocalDateTimeParam(filters.startDate));
    }
    if (filters.endDate) {
      params = params.set('endDate', this.toLocalDateTimeParam(filters.endDate));
    }
    return this.http.get<ChangeLog[]>(this.apiUrl, { params });
  }

  private toLocalDateTimeParam(value: Date | string): string {
    if (value instanceof Date) {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      const hours = String(value.getHours()).padStart(2, '0');
      const minutes = String(value.getMinutes()).padStart(2, '0');
      const seconds = String(value.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    }
    return value;
  }
}
