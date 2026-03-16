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

  toTikTokEmbedUrl(url: string): SafeResourceUrl {
    const match = url.match(/\/video\/(\d+)/);
    const videoId = match?.[1];

    return this.sanitizer.bypassSecurityTrustResourceUrl(
      videoId ? `https://www.tiktok.com/embed/v2/${videoId}` : ''
    );
  }
}
