import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { Video } from '../models/video.model';
import { MOCK_VIDEOS } from './mock-videos.data';

interface VideoApiResponse {
  id: number;
  tiktokUrl: string;
  localMp4Url: string | null;
  previewImageUrl: string | null;
  title: string | null;
  isActive: boolean | null;
  products: ProductApiResponse[] | null;
}

interface ProductApiResponse {
  id: number;
  name: string;
  imageUrl: string | null;
  productLinkId: number | null;
  productLink: ProductLinkApiResponse | null;
}

interface ProductLinkApiResponse {
  id: number;
  url: string;
  type: 'product' | 'social' | 'partner' | 'footer' | 'other';
  isActive: boolean | null;
}

@Injectable({
  providedIn: 'root'
})
export class VideoService {
  constructor(
    private http: HttpClient,
    @Inject('BACKEND_URL') private backendUrl: string
  ) {}

  getVideos(categoryId: number | null = null): Observable<Video[]> {
    let params = new HttpParams();
    if (categoryId != null) {
      params = params.set('categoryId', String(categoryId));
    }
    return this.http
      .get<VideoApiResponse[]>(`${this.backendUrl}/api/videos`, { params })
      .pipe(
        map((rows) => rows.map((row) => this.mapRow(row))),
        catchError(() => of(this.fallbackVideos(categoryId)))
      );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.backendUrl}/api/videos/${id}`);
  }

  private mapRow(row: VideoApiResponse): Video {
    return {
      id: row.id,
      title: row.title ?? '',
      tiktokUrl: row.tiktokUrl ?? '',
      previewImageUrl: row.previewImageUrl ?? '',
      isActive: row.isActive ?? true,
      createdAt: '',
      categoryIds: [],
      products: (row.products ?? []).map((product) => ({
        id: product.id,
        name: product.name,
        imageUrl: product.imageUrl || this.fallbackProductImage(product.name),
        productLink: {
          id: product.productLink?.id ?? product.productLinkId ?? 0,
          url: product.productLink?.url ?? '#',
          type: product.productLink?.type ?? 'product'
        }
      }))
    };
  }

  private fallbackProductImage(name: string): string {
    const normalized = name.toLowerCase();
    if (normalized.includes('miska') || normalized.includes('kubk')) {
      return 'https://img.kwcdn.com/product/fancy/60f70492-8d28-4688-9cac-567e5e5a6724.jpg';
    }
    if (normalized.includes('organizer') || normalized.includes('bluzy')) {
      return 'https://img.kwcdn.com/product/fancy/2a3e78bc-00df-4f13-8dc9-0054ff0b1524.jpg';
    }
    if (normalized.includes('taśm') || normalized.includes('tasm')) {
      return 'https://img.kwcdn.com/product/fancy/f5a68220-4472-4fdf-b76b-722e947b6524.jpg';
    }
    if (normalized.includes('album')) {
      return 'https://img.kwcdn.com/product/fancy/97f50a72-626f-48d8-aac2-7c5ae631fc51.jpg';
    }
    if (normalized.includes('miarka')) {
      return 'https://img.kwcdn.com/product/fancy/7634f292-754c-47fa-84ae-b6ec3ce49b25.jpg';
    }
    if (normalized.includes('pies')) {
      return 'https://img.kwcdn.com/product/fancy/60f70492-8d28-4688-9cac-567e5e5a6724.jpg';
    }
    return 'https://img.kwcdn.com/product/fancy/7634f292-754c-47fa-84ae-b6ec3ce49b25.jpg';
  }

  private fallbackVideos(categoryId: number | null): Video[] {
    return MOCK_VIDEOS
      .filter((video) => !categoryId || video.categoryIds.includes(categoryId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}
