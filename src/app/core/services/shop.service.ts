import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SaveShopPayload, Shop } from '../models/shop.model';

@Injectable({
  providedIn: 'root'
})
export class ShopService {
  private readonly apiUrl: string;

  constructor(
    private http: HttpClient,
    @Inject('BACKEND_URL') backendUrl: string
  ) {
    this.apiUrl = `${backendUrl}/api/shops`;
  }

  getAllActive(): Observable<Shop[]> {
    return this.http.get<Shop[]>(this.apiUrl);
  }

  getAll(): Observable<Shop[]> {
    const params = new HttpParams().set('activeOnly', 'false');
    return this.http.get<Shop[]>(this.apiUrl, { params });
  }

  getById(id: number): Observable<Shop> {
    return this.http.get<Shop>(`${this.apiUrl}/${id}`);
  }

  create(payload: SaveShopPayload): Observable<Shop> {
    return this.http.post<Shop>(this.apiUrl, payload);
  }

  update(id: number, payload: SaveShopPayload): Observable<Shop> {
    return this.http.put<Shop>(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
