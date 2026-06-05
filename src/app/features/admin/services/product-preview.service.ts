import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface ProductPreview {
  name: string;
  imageUrl: string | null;
  platform: string;
  requiresManualImage: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProductPreviewService {
  constructor(
    private http: HttpClient,
    @Inject('BACKEND_URL') private backendUrl: string
  ) {}

  preview(url: string): Observable<ProductPreview> {
    const params = new HttpParams().set('url', url);
    return this.http.get<ProductPreview>(`${this.backendUrl}/api/products/preview`, { params });
  }
}
