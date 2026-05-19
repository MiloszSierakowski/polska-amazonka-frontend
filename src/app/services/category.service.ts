import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { Category } from '../features/public/models/category.model';

const FALLBACK_CATEGORIES: Category[] = [
  { id: 1, name: 'topka', imageUrl: '/categories/topka.png' },
  { id: 2, name: 'temu', imageUrl: '/categories/temu.png' },
  { id: 3, name: 'aliexpress', imageUrl: '/categories/aliexpress.png' },
  { id: 4, name: 'dom', imageUrl: '/categories/dom.png' },
  { id: 5, name: 'znaleziska', imageUrl: '/categories/znaleziska.png' },
  { id: 6, name: 'dzieci', imageUrl: '/categories/dzieci.png' },
  { id: 7, name: 'zwierzęta', imageUrl: '/categories/zwierzeta.png' }
];

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  private apiUrl: string;

  constructor(
    private http: HttpClient,
    @Inject('BACKEND_URL') backendUrl: string
  ) {
    this.apiUrl = backendUrl + '/api/categories';
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.apiUrl).pipe(
      catchError(() => of(FALLBACK_CATEGORIES))
    );
  }
}
