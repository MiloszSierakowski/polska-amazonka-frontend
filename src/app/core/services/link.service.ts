import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LinkDTO {
  id: number;
  url: string;
  type: string;
  imagePath?: string | null;
  displayOrder?: number | null;
  isActive: boolean;
  lastCheckedAt?: string | null;
}

export interface SaveLinkPayload {
  url: string;
  type?: string;
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class LinkService {

  private apiUrl: string;

  constructor(
    private http: HttpClient,
    @Inject('BACKEND_URL') backendUrl: string
  ) {
    this.apiUrl = backendUrl + '/api/links';
  }

  getSocialLinks(): Observable<LinkDTO[]> {
    return this.http.get<LinkDTO[]>(this.apiUrl + '?type=social');
  }

  resolveImageUrl(imagePath: string | null | undefined): string | null {
    const trimmed = imagePath?.trim();
    if (!trimmed) {
      return null;
    }
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    return `${this.apiUrl.replace('/api/links', '')}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
  }

  resolveIconUrl(link: LinkDTO): string {
    return this.resolveImageUrl(link.imagePath) ?? this.defaultIconUrl(link.url);
  }

  defaultIconUrl(url: string): string {
    return `assets/icons/${this.resolvePlatform(url)}.png`;
  }

  private resolvePlatform(url: string): string {
    const lower = url.toLowerCase();
    if (lower.includes('tiktok')) {
      return 'tiktok';
    }
    if (lower.includes('instagram')) {
      return 'instagram';
    }
    if (lower.includes('facebook')) {
      return 'facebook';
    }
    if (lower.includes('youtube')) {
      return 'youtube';
    }
    return 'default';
  }
}
