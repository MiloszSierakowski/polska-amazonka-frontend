import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AdminProductSearchResult } from '../models/admin-product-search.model';

@Injectable({ providedIn: 'root' })
export class AdminProductService {
  constructor(
    private http: HttpClient,
    @Inject('BACKEND_URL') private backendUrl: string
  ) {}

  search(query: string, videoId: number, page = 0, limit = 25): Observable<AdminProductSearchResult[]> {
    const params = new HttpParams()
      .set('query', query)
      .set('videoId', String(videoId))
      .set('page', String(page))
      .set('limit', String(limit));
    return this.http.get<AdminProductSearchResult[]>(
      `${this.backendUrl}/api/admin/products/search`,
      { params }
    );
  }

  attach(
    videoId: number,
    productId: number
  ): Observable<void> {
    return this.http.post<void>(
      `${this.backendUrl}/api/videos/${videoId}/products/${productId}/attach`,
      {}
    );
  }
}
