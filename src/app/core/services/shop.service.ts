import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Shop } from '../models/shop.model';

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
}
