import { HttpClient } from '@angular/common/http';

import { Inject, Injectable } from '@angular/core';

import { Observable, map } from 'rxjs';

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

    return this.http.get<unknown>(this.apiUrl).pipe(map((items) => this.normalizeItems(items)));

  }



  normalizeItems(items: unknown): BrokenLinkProduct[] {

    if (!Array.isArray(items)) {

      return [];

    }

    return items

      .map((item) => this.normalizeItem(item))

      .filter((item): item is BrokenLinkProduct => item != null);

  }



  private normalizeItem(raw: unknown): BrokenLinkProduct | null {

    if (raw == null || typeof raw !== 'object') {

      return null;

    }

    const item = raw as Record<string, unknown>;

    const videoId = this.readNumber(item['videoId'], item['video_id']);

    const productId = this.readNumber(item['productId'], item['product_id']);

    if (videoId == null || productId == null) {

      return null;

    }

    return {

      videoId,

      videoTitle: this.readString(item['videoTitle'], item['video_title']) || `Film #${videoId}`,
      videoPreviewImageUrl: this.readString(
        item['videoPreviewImageUrl'],
        item['video_preview_image_url']
      ),
      productId,

      productName: this.readString(item['productName'], item['product_name']) || 'Produkt bez nazwy',

      imageUrl: this.readString(item['imageUrl'], item['image_url']),

      shopUrl: this.readString(item['shopUrl'], item['shop_url']) || '',

      linkId: this.readNumber(item['linkId'], item['link_id']) ?? 0,

      isBroken: item['isBroken'] === true || item['is_broken'] === true,

      needsReview: item['needsReview'] === true || item['needs_review'] === true

    };

  }



  private readString(...values: unknown[]): string | null {

    for (const value of values) {

      if (typeof value === 'string' && value.trim()) {

        return value.trim();

      }

    }

    return null;

  }



  private readNumber(...values: unknown[]): number | null {

    for (const value of values) {

      if (typeof value === 'number' && Number.isFinite(value)) {

        return value;

      }

      if (typeof value === 'string' && value.trim()) {

        const parsed = Number(value);

        if (Number.isFinite(parsed)) {

          return parsed;

        }

      }

    }

    return null;

  }

}


