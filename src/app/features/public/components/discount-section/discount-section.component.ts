import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PublicDiscountCode } from '../../models/public-discount-code.model';
import { PublicDiscountService } from '../../services/public-discount.service';

export interface PlatformConfigEntry {
  backgroundColor: string;
  logoSrc: string;
  shopUrl: string;
}

export const PLATFORM_CONFIG: Record<string, PlatformConfigEntry> = {
  ALIEXPRESS: {
    backgroundColor: '#e42c1b',
    logoSrc: 'assets/discount/aliexpressmini.png',
    shopUrl: 'https://pl.aliexpress.com'
  },
  TEMU: {
    backgroundColor: '#fb7800',
    logoSrc: 'assets/discount/temu.png',
    shopUrl: 'https://www.temu.com'
  },
  AMAZON: {
    backgroundColor: '#FF9900',
    logoSrc: 'assets/discount/discount.png',
    shopUrl: 'https://www.amazon.pl'
  },
  ALLEGRO: {
    backgroundColor: '#ff5a00',
    logoSrc: 'assets/discount/discount.png',
    shopUrl: 'https://allegro.pl'
  }
};

export const DEFAULT_PLATFORM_CONFIG: PlatformConfigEntry = {
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

  platformConfig(platform: string): PlatformConfigEntry {
    const key = platform.trim().toUpperCase();
    return PLATFORM_CONFIG[key] ?? DEFAULT_PLATFORM_CONFIG;
  }

  copyCode(code: string): void {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code);
    }
  }

  openShop(platform: string): void {
    window.open(this.platformConfig(platform).shopUrl, '_blank', 'noopener,noreferrer');
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
