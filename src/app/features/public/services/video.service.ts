import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Video } from '../models/video.model';

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

export interface CreateVideoProductPayload {
  name?: string | null;
  imageUrl?: string | null;
  productLink: {
    url: string;
    type: 'product';
  };
}

export interface CreateVideoPayload {
  title: string;
  tiktokUrl: string;
  isActive: boolean;
  localMp4Url?: string | null;
  products?: CreateVideoProductPayload[];
}

export interface UpdateVideoPayload {
  title: string;
  tiktokUrl: string;
  isActive: boolean;
  localMp4Url?: string | null;
}

export interface AddVideoProductPayload {
  name?: string | null;
  imageUrl?: string | null;
  productLink: {
    url: string;
    type: 'product';
  };
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
      .pipe(map((rows) => rows.map((row) => this.mapRow(row))));
  }

  getPublicVideos(categoryId: number | null = null): Observable<Video[]> {
    let params = new HttpParams();
    if (categoryId != null) {
      params = params.set('categoryId', String(categoryId));
    }
    return this.http
      .get<VideoApiResponse[]>(`${this.backendUrl}/api/public/videos`, { params })
      .pipe(map((rows) => rows.map((row) => this.mapRow(row))));
  }

  getById(id: number): Observable<Video> {
    return this.http
      .get<VideoApiResponse>(`${this.backendUrl}/api/videos/${id}`)
      .pipe(map((row) => this.mapRow(row)));
  }

  getPublicById(id: number): Observable<Video> {
    return this.http
      .get<VideoApiResponse>(`${this.backendUrl}/api/public/videos/${id}`)
      .pipe(map((row) => this.mapRow(row)));
  }

  create(payload: CreateVideoPayload): Observable<Video> {
    return this.http
      .post<VideoApiResponse>(`${this.backendUrl}/api/videos`, payload)
      .pipe(map((row) => this.mapRow(row)));
  }

  update(id: number, payload: UpdateVideoPayload): Observable<Video> {
    return this.http
      .put<VideoApiResponse>(`${this.backendUrl}/api/videos/${id}`, payload)
      .pipe(map((row) => this.mapRow(row)));
  }

  addProduct(videoId: number, payload: AddVideoProductPayload): Observable<Video> {
    return this.http
      .post<VideoApiResponse>(`${this.backendUrl}/api/videos/${videoId}/products`, payload)
      .pipe(map((row) => this.mapRow(row)));
  }

  updateProduct(videoId: number, productId: number, payload: AddVideoProductPayload): Observable<Video> {
    return this.http
      .put<VideoApiResponse>(`${this.backendUrl}/api/videos/${videoId}/products/${productId}`, payload)
      .pipe(map((row) => this.mapRow(row)));
  }

  detachProduct(videoId: number, productId: number): Observable<Video> {
    return this.http
      .delete<VideoApiResponse>(`${this.backendUrl}/api/videos/${videoId}/products/${productId}`)
      .pipe(map((row) => this.mapRow(row)));
  }

  resyncProduct(videoId: number, productId: number): Observable<Video> {
    return this.http
      .post<VideoApiResponse>(`${this.backendUrl}/api/videos/${videoId}/products/${productId}/resync`, {})
      .pipe(map((row) => this.mapRow(row)));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.backendUrl}/api/videos/${id}`);
  }

  resolvePreviewImageUrl(previewImageUrl: string | null | undefined): string {
    const trimmed = previewImageUrl?.trim();
    if (trimmed) {
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
      }
      return `${this.backendUrl}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
    }
    return `${this.backendUrl}/uploads/videos/default.png`;
  }

  resolveProductRedirectUrl(productId: number): string {
    return `${this.backendUrl}/api/public/products/${productId}/redirect`;
  }

  resolveProductImageUrl(imageUrl: string | null | undefined): string {
    const trimmed = imageUrl?.trim();
    if (!trimmed || trimmed.endsWith('/uploads/products/default.png')) {
      return 'https://placehold.co/400x400/e8f4fc/1a7bb8?text=Produkt';
    }
    if (this.isAllegroImageUrl(trimmed)) {
      const params = new URLSearchParams({ url: trimmed });
      return `${this.backendUrl}/api/products/image?${params.toString()}`;
    }
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    return `${this.backendUrl}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
  }

  private isAllegroImageUrl(imageUrl: string): boolean {
    try {
      const host = new URL(imageUrl).hostname.toLowerCase();
      return host === 'a.allegroimg.com' || host === 'assets.allegrostatic.com';
    } catch {
      return false;
    }
  }

  private mapRow(row: VideoApiResponse): Video {
    return {
      id: row.id,
      title: row.title ?? '',
      tiktokUrl: row.tiktokUrl ?? '',
      previewImageUrl: this.resolvePreviewImageUrl(row.previewImageUrl),
      isActive: row.isActive ?? true,
      createdAt: '',
      categoryIds: [],
      products: (row.products ?? []).map((product) => ({
        id: product.id,
        name: product.name,
        imageUrl: this.resolveProductImageUrl(product.imageUrl),
        productLink: {
          id: product.productLink?.id ?? product.productLinkId ?? 0,
          url: product.productLink?.url ?? '#',
          type: product.productLink?.type ?? 'product'
        }
      }))
    };
  }
}
