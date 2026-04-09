import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { VideoMockService } from '../../services/video-mock.service';
import { Product, Video } from '../../models/video.model';

@Component({
  selector: 'app-videos-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './videos-grid.component.html',
  styleUrl: './videos-grid.component.scss'
})
export class VideosGridComponent implements OnChanges {
  @Input() selectedCategoryId: number | null = null;

  videos: Video[] = [];
  selectedVideo: Video | null = null;
  showProductsOnMobile = false;
  selectedProductForRedirect: Product | null = null;

  constructor(
    private videoMockService: VideoMockService,
    private sanitizer: DomSanitizer
  ) {
    this.loadVideos();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedCategoryId']) {
      this.loadVideos();
    }
  }

  loadVideos(): void {
    this.videoMockService.getVideos(this.selectedCategoryId).subscribe((videos) => {
      this.videos = videos;
    });
  }

  openModal(video: Video): void {
    this.selectedVideo = video;
    this.showProductsOnMobile = false;
    this.selectedProductForRedirect = null;
    document.body.style.overflow = 'hidden';
  }

  closeModal(): void {
    this.selectedVideo = null;
    this.selectedProductForRedirect = null;
    this.showProductsOnMobile = false;
    document.body.style.overflow = '';
  }

  showProductsPanel(): void {
    this.showProductsOnMobile = true;
  }

  showVideoPanel(): void {
    this.showProductsOnMobile = false;
  }

  onProductClick(event: MouseEvent, product: Product): void {
    event.preventDefault();
    this.selectedProductForRedirect = product;
  }

  onPreviewImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'https://placehold.co/720x1280/111827/ffffff?text=Miniatura+TikTok';
  }

  choosePlatform(platform: 'temu' | 'aliexpress'): void {
    if (!this.selectedProductForRedirect) {
      return;
    }

    const targetUrl = this.resolvePlatformUrl(this.selectedProductForRedirect, platform);
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
    this.selectedProductForRedirect = null;
  }

  closePlatformChooser(): void {
    this.selectedProductForRedirect = null;
  }

  toTikTokEmbedUrl(url: string): SafeResourceUrl {
    const match = url.match(/\/video\/(\d+)/);
    const videoId = match?.[1];

    return this.sanitizer.bypassSecurityTrustResourceUrl(
      videoId
        ? `https://www.tiktok.com/embed/v2/${videoId}?lang=pl-PL`
        : ''
    );
  }

  private resolvePlatformUrl(product: Product, platform: 'temu' | 'aliexpress'): string {
    const currentUrl = product.productLink.url;

    if (currentUrl.includes(platform)) {
      return currentUrl;
    }

    const query = encodeURIComponent(product.name);

    return platform === 'temu'
      ? `https://www.temu.com/pl/search_result.html?search_key=${query}`
      : `https://www.aliexpress.com/wholesale?SearchText=${query}`;
  }
}
