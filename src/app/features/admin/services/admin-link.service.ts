import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LinkDTO, SaveLinkPayload } from '../../../core/services/link.service';

@Injectable({
  providedIn: 'root'
})
export class AdminLinkService {
  private readonly apiUrl: string;

  constructor(
    private http: HttpClient,
    @Inject('BACKEND_URL') backendUrl: string
  ) {
    this.apiUrl = `${backendUrl}/api/admin/links`;
  }

  getSocialLinks(): Observable<LinkDTO[]> {
    return this.http.get<LinkDTO[]>(this.apiUrl);
  }

  create(payload: SaveLinkPayload): Observable<LinkDTO> {
    return this.http.post<LinkDTO>(this.apiUrl, payload);
  }

  update(id: number, payload: SaveLinkPayload): Observable<LinkDTO> {
    return this.http.put<LinkDTO>(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
