import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { VideoMockService } from '../../services/video-mock.service';
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
    document.body.style.overflow = 'hidden';
  }

  closeModal(): void {
    this.selectedVideo = null;
    document.body.style.overflow = '';
  }


  onPreviewImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'https://placehold.co/720x1280/111827/ffffff?text=Miniatura+TikTok';
  }

  toTikTokEmbedUrl(url: string): SafeResourceUrl {
    const match = url.match(/\/video\/(\d+)/);
    const videoId = match?.[1];

    const params = new URLSearchParams({
      controls: '0',
      progress_bar: '0',
      play_button: '0',
      volume_control: '0',
      fullscreen_button: '0',
      timestamp: '0',
      music_info: '0',
      description: '0',
      closed_caption: '0',
      rel: '0',
      native_context_menu: '0'
    });

    return this.sanitizer.bypassSecurityTrustResourceUrl(
      videoId ? `https://www.tiktok.com/player/v1/${videoId}?${params.toString()}` : ''
    );
  }
}
