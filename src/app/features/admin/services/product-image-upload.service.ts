import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface ProductImageUploadResponse {
  imageUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductImageUploadService {
  constructor(
    private http: HttpClient,
    @Inject('BACKEND_URL') private backendUrl: string
  ) {}

  upload(file: File): Observable<ProductImageUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ProductImageUploadResponse>(
      `${this.backendUrl}/api/products/image-upload`,
      formData
    );
  }
}
