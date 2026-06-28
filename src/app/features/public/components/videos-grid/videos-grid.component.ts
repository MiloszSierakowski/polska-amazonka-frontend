import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VideoService } from '../../services/video.service';
import { Video } from '../../models/video.model';

@Component({
  selector: 'app-videos-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './videos-grid.component.html',
  styleUrl: './videos-grid.component.scss'
})
export class VideosGridComponent implements OnChanges, OnDestroy {
  @Input() selectedCategoryId: number | null = null;
  @Output() loadFailed = new EventEmitter<void>();
  @Output() videoSelected = new EventEmitter<Video>();

  videos: Video[] = [];
  hasLoadError = false;
  isLoadingVideos = false;
  private readonly brokenPreviewUrls = new Set<string>();

  constructor(
    private videoService: VideoService
  ) {
    this.loadVideos();
  }

  ngOnDestroy(): void {
    this.brokenPreviewUrls.clear();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedCategoryId']) {
      this.loadVideos();
    }
  }

  get emptyStateMessage(): string {
    if (this.selectedCategoryId != null) {
      return 'Brak filmów dla tej kategorii.';
    }
    return 'Brak filmów do wyświetlenia.';
  }

  loadVideos(): void {
    this.isLoadingVideos = true;
    this.videoService.getPublicVideos(this.selectedCategoryId).subscribe({
      next: (videos) => {
        this.hasLoadError = false;
        this.isLoadingVideos = false;
        this.videos = videos.filter((v) => v.isActive);
        this.brokenPreviewUrls.clear();
      },
      error: () => {
        this.hasLoadError = true;
        this.isLoadingVideos = false;
        this.videos = [];
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
}
