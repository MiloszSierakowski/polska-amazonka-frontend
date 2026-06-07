import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface ClickStatAggregation {
  entityType: string;
  entityId: number;
  clickCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private readonly apiUrl: string;

  constructor(
    private http: HttpClient,
    @Inject('BACKEND_URL') backendUrl: string
  ) {
    this.apiUrl = `${backendUrl}/api/admin/analytics/stats`;
  }

  getStats(from: Date, to: Date): Observable<ClickStatAggregation[]> {
    const params = new HttpParams()
      .set('from', this.formatDateParam(from))
      .set('to', this.formatDateParam(to));
    return this.http.get<ClickStatAggregation[]>(this.apiUrl, { params });
  }

  private formatDateParam(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
