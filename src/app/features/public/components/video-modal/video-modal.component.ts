import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Shop } from '../../../../core/models/shop.model';
import { ShopMatcherService } from '../../../../core/services/shop-matcher.service';
import { Product, Video } from '../../models/video.model';
import { ClickStatService } from '../../services/click-stat.service';
import { VideoService } from '../../services/video.service';

export type VideoModalVariant = 'regular' | 'promoted';

@Component({
  selector: 'app-video-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-modal.component.html',
  styleUrl: './video-modal.component.scss'
})
export class VideoModalComponent implements OnInit, OnChanges, OnDestroy {
  @Input({ required: true }) video!: Video;
  @Input() variant: VideoModalVariant = 'regular';
  @Output() closed = new EventEmitter<void>();

  safeVideoUrl: SafeResourceUrl | null = null;
  isLoadingVideo = true;
  private readonly brokenProductImageIds = new Set<number>();
  private readonly copiedPromoProductIds = new Set<number>();
  private readonly copyResetTimeouts = new Map<number, ReturnType<typeof setTimeout>>();

  constructor(
    private videoService: VideoService,
    private clickStatService: ClickStatService,
    private shopMatcherService: ShopMatcherService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.shopMatcherService.loadActiveShops().subscribe();
    document.body.style.overflow = 'hidden';
    this.prepareVideo();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['video'] && this.video) {
      this.prepareVideo();
    }
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
    this.copyResetTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.copyResetTimeouts.clear();
    this.copiedPromoProductIds.clear();
  }

  close(): void {
    this.closed.emit();
  }

  productImageSrc(productId: number, imageUrl: string): string {
    if (this.brokenProductImageIds.has(productId)) {
      return this.videoService.resolveProductImageUrl(null);
    }
    return this.videoService.resolveProductImageUrl(imageUrl);
  }

  onProductImageError(productId: number): void {
    this.brokenProductImageIds.add(productId);
  }

  productRedirectUrl(productId: number): string {
    return this.videoService.resolveProductRedirectUrl(productId);
  }

  onProductClick(productId: number): void {
    this.clickStatService.recordClick('product', productId);
  }

  hasPromoCode(product: Product): boolean {
    return !!product.promoCode?.trim();
  }

  isPromoCodeCopied(productId: number): boolean {
    return this.copiedPromoProductIds.has(productId);
  }

  copyPromoCode(event: Event, product: Product): void {
    event.preventDefault();
    event.stopPropagation();

    const code = product.promoCode?.trim();
    if (!code) {
      return;
    }

    const copyTask = navigator.clipboard?.writeText
      ? navigator.clipboard.writeText(code)
      : Promise.reject(new Error('Clipboard unavailable'));

    copyTask.then(
      () => this.showCopiedFeedback(product.id),
      () => undefined
    );
  }

  detectProductShop(product: Product): Shop | null {
    return this.shopMatcherService.detectShopFromUrl(product.productLink?.url);
  }

  shopBadgeBackground(product: Product): string {
    return this.shopMatcherService.badgeBackgroundColor(this.detectProductShop(product));
  }

  shopBadgeTextColor(product: Product): string {
    return this.shopMatcherService.badgeTextColor(this.shopBadgeBackground(product));
  }

  private prepareVideo(): void {
    this.isLoadingVideo = true;
    this.brokenProductImageIds.clear();
    this.copiedPromoProductIds.clear();
    this.copyResetTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.copyResetTimeouts.clear();
    this.safeVideoUrl = this.getTikTokSafeUrl(this.video.tiktokUrl);
  }

  private showCopiedFeedback(productId: number): void {
    const existingTimeout = this.copyResetTimeouts.get(productId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    this.copiedPromoProductIds.add(productId);
    const timeout = setTimeout(() => {
      this.copiedPromoProductIds.delete(productId);
      this.copyResetTimeouts.delete(productId);
    }, 2000);
    this.copyResetTimeouts.set(productId, timeout);
  }

  private getTikTokSafeUrl(url: string): SafeResourceUrl {
    const match = url.match(/\/video\/(\d+)/);
    const videoId = match?.[1];

    const params = new URLSearchParams({
      controls: '1',
      progress_bar: '1',
      play_button: '1',
      volume_control: '1',
      fullscreen_button: '0',
      timestamp: '0',
      music_info: '0',
      description: '0',
      closed_caption: '0',
      rel: '0',
      native_context_menu: '0'
    });

    const finalUrl = videoId
      ? `https://www.tiktok.com/player/v1/${videoId}?${params.toString()}`
      : '';

    return this.sanitizer.bypassSecurityTrustResourceUrl(finalUrl);
  }
}
