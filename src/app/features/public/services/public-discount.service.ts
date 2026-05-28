import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PublicDiscountCode } from '../models/public-discount-code.model';

@Injectable({
  providedIn: 'root'
})
export class PublicDiscountService {
  private readonly apiUrl: string;

  constructor(
    private http: HttpClient,
    @Inject('BACKEND_URL') backendUrl: string
  ) {
    this.apiUrl = `${backendUrl}/api/public/discount-codes`;
  }

  getActiveDiscountCodes(): Observable<PublicDiscountCode[]> {
    return this.http.get<PublicDiscountCode[]>(this.apiUrl);
  }
}
