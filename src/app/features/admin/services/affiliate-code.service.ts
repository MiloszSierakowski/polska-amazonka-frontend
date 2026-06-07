import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AffiliateCode } from '../models/affiliate-code.model';

export interface SaveAffiliateCodePayload {
  shopId: number;
  codeValue: string;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AffiliateCodeService {
  private readonly apiUrl: string;

  constructor(
    private http: HttpClient,
    @Inject('BACKEND_URL') backendUrl: string
  ) {
    this.apiUrl = `${backendUrl}/api/affiliate-codes`;
  }

  getAll(): Observable<AffiliateCode[]> {
    return this.http.get<AffiliateCode[]>(this.apiUrl);
  }

  create(payload: SaveAffiliateCodePayload): Observable<AffiliateCode> {
    return this.http.post<AffiliateCode>(this.apiUrl, payload);
  }

  update(id: number, payload: SaveAffiliateCodePayload): Observable<AffiliateCode> {
    return this.http.put<AffiliateCode>(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
