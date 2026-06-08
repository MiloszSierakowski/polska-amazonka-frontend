import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BrokenLinkProduct } from '../models/broken-link.model';

@Injectable({
  providedIn: 'root'
})
export class BrokenLinkService {
  private readonly apiUrl: string;

  constructor(
    private http: HttpClient,
    @Inject('BACKEND_URL') backendUrl: string
  ) {
    this.apiUrl = `${backendUrl}/api/admin/broken-links`;
  }

  getAll(): Observable<BrokenLinkProduct[]> {
    return this.http.get<BrokenLinkProduct[]>(this.apiUrl);
  }
}
