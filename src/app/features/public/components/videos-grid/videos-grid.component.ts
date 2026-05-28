import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { VideoService } from '../../services/video.service';
import { Video } from '../../models/video.model';

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
  safeVideoUrl: SafeResourceUrl | null = null;
  isLoadingVideo = false;
  private readonly brokenPreviewUrls = new Set<string>();

  constructor(
    private videoService: VideoService,
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
    this.videoService.getVideos(this.selectedCategoryId).subscribe((videos) => {
      this.videos = videos.filter((v) => v.isActive);
      this.brokenPreviewUrls.clear();
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

  openModal(video: Video): void {
    this.isLoadingVideo = true;
    this.selectedVideo = video;
    this.safeVideoUrl = this.getTikTokSafeUrl(video.tiktokUrl);
    document.body.style.overflow = 'hidden';
  }

  closeModal(): void {
    this.selectedVideo = null;
    this.safeVideoUrl = null;
    this.isLoadingVideo = false;
    document.body.style.overflow = '';
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
