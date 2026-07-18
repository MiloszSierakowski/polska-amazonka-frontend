import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  LinkValidationRun,
  LinkValidationRunDetails,
  LinkValidationStatus
} from '../models/link-validation.model';

@Injectable({ providedIn: 'root' })
export class LinkValidationService {
  private readonly apiUrl: string;

  constructor(
    private http: HttpClient,
    @Inject('BACKEND_URL') backendUrl: string
  ) {
    this.apiUrl = `${backendUrl}/api/admin/link-validation`;
  }

  getStatus(): Observable<LinkValidationStatus> {
    return this.http.get<LinkValidationStatus>(`${this.apiUrl}/status`);
  }

  getRuns(limit = 20): Observable<LinkValidationRun[]> {
    const params = new HttpParams().set('limit', String(limit));
    return this.http.get<LinkValidationRun[]>(`${this.apiUrl}/runs`, { params });
  }

  getRun(runId: number): Observable<LinkValidationRunDetails> {
    return this.http.get<LinkValidationRunDetails>(`${this.apiUrl}/runs/${runId}`);
  }
}
