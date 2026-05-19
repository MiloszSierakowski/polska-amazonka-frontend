import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';

export interface LinkDTO {
  id: number;
  url: string;
  type: string;
  isActive: boolean;
  lastCheckedAt: string | null;
}

const FALLBACK_SOCIAL_LINKS: LinkDTO[] = [
  {
    id: 1,
    url: 'https://www.tiktok.com/@polskaamazonka',
    type: 'social',
    isActive: true,
    lastCheckedAt: null
  },
  {
    id: 2,
    url: 'https://www.instagram.com/polskaamazonka',
    type: 'social',
    isActive: true,
    lastCheckedAt: null
  },
  {
    id: 3,
    url: 'https://www.facebook.com/polskaamazonka',
    type: 'social',
    isActive: true,
    lastCheckedAt: null
  },
  {
    id: 4,
    url: 'https://www.youtube.com/@polskaamazonka',
    type: 'social',
    isActive: false,
    lastCheckedAt: null
  }
];

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
    return this.http.get<LinkDTO[]>(this.apiUrl + '?type=social').pipe(
      catchError(() => of(FALLBACK_SOCIAL_LINKS))
    );
  }
}
