import { Injectable } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { Shop } from '../models/shop.model';
import { ShopService } from './shop.service';

@Injectable({
  providedIn: 'root'
})
export class ShopMatcherService {
  private shops: Shop[] = [];
  private loaded = false;

  constructor(private shopService: ShopService) {}

  loadActiveShops(): Observable<Shop[]> {
    if (this.loaded) {
      return of(this.shops);
    }
    return this.shopService.getAllActive().pipe(
      tap((shops) => {
        this.shops = shops.filter((shop) => shop.isActive !== false);
        this.loaded = true;
      })
    );
  }

  detectShopFromUrl(productUrl: string | null | undefined): Shop | null {
    if (!productUrl?.trim()) {
      return null;
    }

    const normalizedUrl = productUrl.trim().toLowerCase();
    const candidates = [...this.shops].sort((a, b) => b.slug.length - a.slug.length);

    for (const shop of candidates) {
      if (this.urlMatchesShop(normalizedUrl, shop)) {
        return shop;
      }
    }

    return null;
  }

  badgeBackgroundColor(shop: Shop | null): string {
    return shop?.colorCode?.trim() || '#64748B';
  }

  badgeTextColor(backgroundColor: string): string {
    const rgb = this.parseHexColor(backgroundColor);
    if (!rgb) {
      return '#FFFFFF';
    }
    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    return luminance > 0.62 ? '#111827' : '#FFFFFF';
  }

  private urlMatchesShop(url: string, shop: Shop): boolean {
    const slug = shop.slug?.trim().toLowerCase();
    if (slug && url.includes(slug)) {
      return true;
    }

    const code = shop.code?.trim().toLowerCase();
    if (code && url.includes(code)) {
      return true;
    }

    const nameKey = shop.name?.trim().toLowerCase().replace(/\s+/g, '');
    return Boolean(nameKey && url.includes(nameKey));
  }

  private parseHexColor(value: string): { r: number; g: number; b: number } | null {
    const normalized = value.trim().replace(/^#/, '');
    if (!/^[0-9A-Fa-f]{6}$/.test(normalized)) {
      return null;
    }
    return {
      r: parseInt(normalized.slice(0, 2), 16),
      g: parseInt(normalized.slice(2, 4), 16),
      b: parseInt(normalized.slice(4, 6), 16)
    };
  }
}
