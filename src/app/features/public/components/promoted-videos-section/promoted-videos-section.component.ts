import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { Video } from '../../models/video.model';
import { VideoService } from '../../services/video.service';

@Component({
  selector: 'app-promoted-videos-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './promoted-videos-section.component.html',
  styleUrl: './promoted-videos-section.component.scss'
})
export class PromotedVideosSectionComponent implements OnInit, AfterViewInit, OnDestroy {
  @Output() videoSelected = new EventEmitter<Video>();
  @Output() loadFailed = new EventEmitter<void>();
  @ViewChild('scrollContainer') scrollContainer?: ElementRef<HTMLElement>;

  promotedVideos: Video[] = [];
  isLoading = false;
  hasLoadError = false;
  hasOverflow = false;
  canScrollLeft = false;
  canScrollRight = false;

  private readonly brokenPreviewUrls = new Set<string>();
  private scrollListener?: () => void;
  private resizeObserver?: ResizeObserver;
  private trackingInitialized = false;

  constructor(private videoService: VideoService) {}

  ngOnInit(): void {
    this.loadPromotedVideos();
  }

  ngAfterViewInit(): void {
    this.scheduleScrollStateUpdate();
  }

  ngOnDestroy(): void {
    this.teardownScrollTracking();
  }

  get shouldRender(): boolean {
    return !this.hasLoadError && !this.isLoading && this.promotedVideos.length > 0;
  }

  loadPromotedVideos(): void {
    this.isLoading = true;
    this.videoService.getPromotedPublicVideos().subscribe({
      next: (videos) => {
        this.isLoading = false;
        this.hasLoadError = false;
        this.promotedVideos = videos.filter((video) => video.isActive);
        this.brokenPreviewUrls.clear();
        this.scheduleScrollStateUpdate();
      },
      error: () => {
        this.isLoading = false;
        this.hasLoadError = true;
        this.promotedVideos = [];
        this.loadFailed.emit();
      }
    });
  }

  previewSrc(video: Video): string {
    const url = video.previewImageUrl;
    if (this.brokenPreviewUrls.has(url)) {
      return this.videoService.resolvePreviewImageUrl('/uploads/videos/default.png');
    }
    return url;
  }

  onPreviewError(video: Video): void {
    this.brokenPreviewUrls.add(video.previewImageUrl);
  }

  selectVideo(video: Video): void {
    this.videoSelected.emit(video);
  }

  scrollByDirection(direction: -1 | 1): void {
    const container = this.scrollContainer?.nativeElement;
    if (!container) {
      return;
    }

    const tile = container.querySelector('.promoted-video-tile') as HTMLElement | null;
    const scrollAmount = tile ? tile.offsetWidth + 14 : 220;
    container.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
  }

  private scheduleScrollStateUpdate(): void {
    requestAnimationFrame(() => {
      this.ensureScrollTracking();
      this.updateScrollState();
    });
  }

  private ensureScrollTracking(): void {
    const container = this.scrollContainer?.nativeElement;
    if (!container || this.trackingInitialized) {
      return;
    }

    this.scrollListener = () => this.updateScrollState();
    container.addEventListener('scroll', this.scrollListener, { passive: true });

    this.resizeObserver = new ResizeObserver(() => this.updateScrollState());
    this.resizeObserver.observe(container);
    this.trackingInitialized = true;
  }

  private teardownScrollTracking(): void {
    const container = this.scrollContainer?.nativeElement;
    if (container && this.scrollListener) {
      container.removeEventListener('scroll', this.scrollListener);
    }

    this.resizeObserver?.disconnect();
    this.scrollListener = undefined;
    this.resizeObserver = undefined;
    this.trackingInitialized = false;
  }

  private updateScrollState(): void {
    const container = this.scrollContainer?.nativeElement;
    if (!container) {
      this.hasOverflow = false;
      this.canScrollLeft = false;
      this.canScrollRight = false;
      return;
    }

    const overflow = container.scrollWidth > container.clientWidth + 1;
    this.hasOverflow = overflow;
    this.canScrollLeft = overflow && container.scrollLeft > 1;
    this.canScrollRight = overflow && container.scrollLeft + container.clientWidth < container.scrollWidth - 1;
  }
}
