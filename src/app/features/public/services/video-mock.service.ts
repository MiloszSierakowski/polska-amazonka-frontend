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
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      )
    );
  }
}
