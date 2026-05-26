import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { Category } from '../features/public/models/category.model';

interface CategoryApiRow {
  id: number;
  name: string;
  imageUrl?: string | null;
  image_url?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  private apiUrl: string;

  constructor(
    private http: HttpClient,
    @Inject('BACKEND_URL') private backendUrl: string
  ) {
    this.apiUrl = backendUrl + '/api/categories';
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<CategoryApiRow[]>(this.apiUrl).pipe(
      map((rows) => this.mapRows(rows)),
      catchError(() => of([]))
    );
  }

  create(name: string, imageFile: File | null): Observable<Category> {
    const formData = new FormData();
    formData.append('name', name);
    if (imageFile) {
      formData.append('imageFile', imageFile);
    }
    return this.http.post<CategoryApiRow>(this.apiUrl, formData).pipe(
      map((row) => this.mapRow(row))
    );
  }

  update(id: number, name: string, imageFile: File | null): Observable<Category> {
    const formData = new FormData();
    formData.append('name', name);
    if (imageFile) {
      formData.append('imageFile', imageFile);
    }
    return this.http.put<CategoryApiRow>(`${this.apiUrl}/${id}`, formData).pipe(
      map((row) => this.mapRow(row))
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  resolveDisplayImageUrl(category: Category, backendUrl: string): string {
    const raw = category.imageUrl?.trim();
    if (raw) {
      if (raw.startsWith('http://') || raw.startsWith('https://')) {
        return raw;
      }
      return `${backendUrl}${raw.startsWith('/') ? '' : '/'}${raw}`;
    }
    const label = encodeURIComponent(category.name || 'Kategoria');
    return `https://placehold.co/220x72/e8f4fc/1a7bb8?text=${label}`;
  }

  private mapRows(rows: CategoryApiRow[] | null | undefined): Category[] {
    if (!rows || !Array.isArray(rows)) {
      return [];
    }
    return rows
      .filter((row) => row?.id != null && row.name != null && String(row.name).trim().length > 0)
      .map((row) => this.mapRow(row));
  }

  private mapRow(row: CategoryApiRow): Category {
    return {
      id: row.id,
      name: String(row.name).trim(),
      imageUrl: row.imageUrl ?? row.image_url ?? null
    };
  }
}
