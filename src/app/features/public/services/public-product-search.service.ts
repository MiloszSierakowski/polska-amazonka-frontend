import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

export interface PublicSearchProduct {
  id: number;
  name: string;
  imageUrl: string | null;
}

interface PublicSearchProductApiRow {
  id: number;
  name: string;
  imageUrl: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class PublicProductSearchService {
  constructor(
    private http: HttpClient,
    @Inject('BACKEND_URL') private backendUrl: string
  ) {}

  search(term: string): Observable<PublicSearchProduct[]> {
    const params = new HttpParams().set('search', term);
    return this.http
      .get<PublicSearchProductApiRow[]>(`${this.backendUrl}/api/public/products/search`, { params })
      .pipe(map((rows) => (rows ?? []).map((row) => this.mapRow(row))));
  }

  resolveRedirectUrl(productId: number): string {
    return `${this.backendUrl}/api/public/products/${productId}/redirect`;
  }

  private mapRow(row: PublicSearchProductApiRow): PublicSearchProduct {
    return {
      id: row.id,
      name: row.name,
      imageUrl: row.imageUrl
    };
  }
}
