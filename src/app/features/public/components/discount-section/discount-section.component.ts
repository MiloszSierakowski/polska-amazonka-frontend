import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PublicDiscountCode } from '../../models/public-discount-code.model';
import { PublicDiscountService } from '../../services/public-discount.service';

export interface ShopVisualEntry {
  backgroundColor: string;
  logoSrc: string;
  shopUrl: string;
}

export const SHOP_VISUALS: Record<string, ShopVisualEntry> = {
  aliexpress: {
    backgroundColor: '#e42c1b',
    logoSrc: 'assets/discount/aliexpressmini.png',
    shopUrl: 'https://pl.aliexpress.com'
  },
  temu: {
    backgroundColor: '#fb7800',
    logoSrc: 'assets/discount/temu.png',
    shopUrl: 'https://www.temu.com'
  },
  amazon: {
    backgroundColor: '#FF9900',
    logoSrc: 'assets/discount/discount.png',
    shopUrl: 'https://www.amazon.pl'
  },
  allegro: {
    backgroundColor: '#ff5a00',
    logoSrc: 'assets/discount/discount.png',
    shopUrl: 'https://allegro.pl'
  }
};

export const DEFAULT_SHOP_VISUAL: ShopVisualEntry = {
  backgroundColor: '#2da2df',
  logoSrc: 'assets/discount/discount.png',
  shopUrl: 'https://www.google.com'
};

@Component({
  selector: 'app-discount-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './discount-section.component.html',
  styleUrl: './discount-section.component.scss'
})
export class DiscountSectionComponent implements OnInit {
  @Output() loadFailed = new EventEmitter<void>();

  discountCodes: PublicDiscountCode[] = [];
  isOpen = false;
  hasLoadError = false;

  constructor(private publicDiscountService: PublicDiscountService) {}

  ngOnInit(): void {
    this.loadDiscountCodes();
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
  }

  shopVisual(slug: string | null | undefined): ShopVisualEntry {
    if (!slug) {
      return DEFAULT_SHOP_VISUAL;
    }
    const key = slug.trim().toLowerCase();
    return SHOP_VISUALS[key] ?? DEFAULT_SHOP_VISUAL;
  }

  copyCode(code: string): void {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code);
    }
  }

  openShop(code: PublicDiscountCode): void {
    window.open(this.shopVisual(code.shopSlug).shopUrl, '_blank', 'noopener,noreferrer');
  }

  private loadDiscountCodes(): void {
    this.publicDiscountService.getActiveDiscountCodes().subscribe({
      next: (codes) => {
        this.hasLoadError = false;
        this.discountCodes = codes;
      },
      error: () => {
        this.hasLoadError = true;
        this.discountCodes = [];
        this.loadFailed.emit();
      }
    });
  }
}
