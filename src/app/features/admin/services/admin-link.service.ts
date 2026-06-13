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

  create(payload: SaveLinkPayload, imageFile: File | null): Observable<LinkDTO> {
    return this.http.post<LinkDTO>(this.apiUrl, this.buildFormData(payload, imageFile));
  }

  update(id: number, payload: SaveLinkPayload, imageFile: File | null): Observable<LinkDTO> {
    return this.http.put<LinkDTO>(`${this.apiUrl}/${id}`, this.buildFormData(payload, imageFile));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  reorder(orderedIds: number[]): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/social/reorder`, orderedIds);
  }

  private buildFormData(payload: SaveLinkPayload, imageFile: File | null): FormData {
    const formData = new FormData();
    formData.append('url', payload.url);
    formData.append('isActive', String(payload.isActive ?? true));
    if (imageFile) {
      formData.append('imageFile', imageFile);
    }
    return formData;
  }
}
