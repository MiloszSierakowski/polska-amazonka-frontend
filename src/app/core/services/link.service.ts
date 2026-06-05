import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LinkDTO {
  id: number;
  url: string;
  type: string;
  isActive: boolean;
  lastCheckedAt: string | null;
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
}
