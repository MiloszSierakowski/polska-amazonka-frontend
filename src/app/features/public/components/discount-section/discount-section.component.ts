import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PublicDiscountCode } from '../../models/public-discount-code.model';
import { PublicDiscountService } from '../../services/public-discount.service';

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

  cardClass(platform: string): string {
    return platform.toLowerCase();
  }

  logoSrc(platform: string): string {
    const normalized = platform.toLowerCase();
    if (normalized === 'aliexpress') {
      return 'assets/discount/aliexpressmini.png';
    }
    if (normalized === 'temu') {
      return 'assets/discount/temu.png';
    }
    return 'assets/discount/discount.png';
  }

  shopUrl(platform: string): string {
    const normalized = platform.toUpperCase();
    if (normalized === 'ALIEXPRESS') {
      return 'https://pl.aliexpress.com';
    }
    if (normalized === 'TEMU') {
      return 'https://www.temu.com';
    }
    return 'https://www.google.com';
  }

  copyCode(code: string): void {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code);
    }
  }

  openShop(platform: string): void {
    window.open(this.shopUrl(platform), '_blank', 'noopener,noreferrer');
  }
}
