import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DiscountCode } from '../models/discount-code.model';

export interface SaveDiscountCodePayload {
  platform: string;
  codeValue: string;
  description: string;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DiscountCodeService {
  private readonly apiUrl: string;

  constructor(
    private http: HttpClient,
    @Inject('BACKEND_URL') backendUrl: string
  ) {
    this.apiUrl = `${backendUrl}/api/discount-codes`;
  }

  getAll(): Observable<DiscountCode[]> {
    return this.http.get<DiscountCode[]>(this.apiUrl);
  }

  create(payload: SaveDiscountCodePayload): Observable<DiscountCode> {
    return this.http.post<DiscountCode>(this.apiUrl, payload);
  }

  update(id: number, payload: SaveDiscountCodePayload): Observable<DiscountCode> {
    return this.http.put<DiscountCode>(`${this.apiUrl}/${id}`, payload);
  }
}
