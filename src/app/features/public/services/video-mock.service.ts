import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Video } from '../models/video.model';
import { MOCK_VIDEOS } from './mock-videos.data';

@Injectable({
  providedIn: 'root'
})
export class VideoMockService {
  getVideos(categoryId: number | null = null): Observable<Video[]> {
    return of(MOCK_VIDEOS).pipe(
      map((videos) =>
        videos
          .filter((video) => video.isActive)
          .filter((video) => !categoryId || video.categoryIds.includes(categoryId))
          .map((video) => ({
            ...video,
            previewImageUrl: this.toTikTokThumbnail(video.tiktokUrl)
          }))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      )
    );
  }

  private toTikTokThumbnail(tiktokUrl: string): string {
    const videoId = this.extractVideoId(tiktokUrl);

    return videoId
      ? `https://www.tiktok.com/api/img/?itemId=${videoId}&location=0`
      : 'https://placehold.co/720x1280/111827/ffffff?text=Brak+miniatury';
  }

  private extractVideoId(url: string): string | null {
    const match = url.match(/\/video\/(\d+)/);

    return match?.[1] ?? null;
  }
}
