import { Location } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, Subject } from 'rxjs';
import { catchError, switchMap, takeUntil } from 'rxjs/operators';
import { SearchBarComponent } from '../../components/search-bar/search-bar.component';
import { CategoriesComponent } from '../../components/categories/categories.component';
import { VideosGridComponent } from '../../components/videos-grid/videos-grid.component';
import { PromotedVideosSectionComponent } from '../../components/promoted-videos-section/promoted-videos-section.component';
import { VideoModalComponent, VideoModalVariant } from '../../components/video-modal/video-modal.component';
import { Video } from '../../models/video.model';
import { VideoService } from '../../services/video.service';
import { ClickStatService } from '../../services/click-stat.service';
import { PUBLIC_OUTAGE_MESSAGE } from '../../constants/public-outage.message';
import {
  isDocumentReload,
  shouldRecordVideoOpenStat,
  VideoRouteNavigationState
} from '../../utils/video-open-stat.util';

const UNAVAILABLE_VIDEO_MESSAGE = 'Film jest niedostępny lub został usunięty.';

interface UnavailableVideoNavigationState {
  showUnavailableVideoModal?: boolean;
}

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [
    CommonModule,
    SearchBarComponent,
    PromotedVideosSectionComponent,
    CategoriesComponent,
    VideosGridComponent,
    VideoModalComponent
  ]
})
export class HomeComponent implements OnInit, OnDestroy {
  selectedCategoryId: number | null = null;
  selectedVideo: Video | null = null;
  modalVariant: VideoModalVariant = 'regular';
  showOutageNotice = false;
  directLinkLoading = false;
  showUnavailableVideoModal = false;
  readonly outageMessage = PUBLIC_OUTAGE_MESSAGE;
  readonly unavailableVideoMessage = UNAVAILABLE_VIDEO_MESSAGE;
  private readonly destroy$ = new Subject<void>();
  private videoStatRecordedForNavigationId: number | null = null;

  constructor(
    private location: Location,
    private route: ActivatedRoute,
    private router: Router,
    private videoService: VideoService,
    private clickStatService: ClickStatService
  ) {}

  ngOnInit(): void {
    this.consumeUnavailableVideoModalFlag();

    this.route.paramMap
      .pipe(
        takeUntil(this.destroy$),
        switchMap((params) => {
          const publicCode = params.get('publicCode')?.trim();
          if (!publicCode) {
            this.clearVideoRouteState();
            this.consumeUnavailableVideoModalFlag();
            return EMPTY;
          }
          this.directLinkLoading = true;
          this.showUnavailableVideoModal = false;
          this.selectedVideo = null;
          this.modalVariant = 'regular';
          return this.videoService.getPublicByCode(publicCode).pipe(
            catchError(() => {
              this.handleUnavailableVideo();
              return EMPTY;
            })
          );
        })
      )
      .subscribe((video) => {
        this.directLinkLoading = false;
        this.showUnavailableVideoModal = false;
        this.maybeRecordVideoOpenStat(video);
        this.displayVideoModal(video, this.resolveModalVariantFromNavigation());
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onCategorySelected(categoryId: number | null): void {
    this.selectedCategoryId = categoryId;
  }

  openVideoFromTile(video: Video, variant: VideoModalVariant = 'regular'): void {
    this.showUnavailableVideoModal = false;
    const publicCode = video.publicCode?.trim();
    if (!publicCode) {
      this.showUnavailableVideoModal = true;
      return;
    }
    void this.router.navigate(['/amafilmy', publicCode], {
      state: {
        modalVariant: variant,
        videoOpenSource: 'tile'
      } satisfies VideoRouteNavigationState
    });
  }

  closeModal(): void {
    if (!this.route.snapshot.paramMap.get('publicCode')?.trim()) {
      this.clearVideoRouteState();
      return;
    }
    this.selectedVideo = null;
    this.modalVariant = 'regular';
    if (this.shouldCloseVideoRouteViaHistoryBack()) {
      this.location.back();
      return;
    }
    void this.router.navigate(['/'], { replaceUrl: true });
  }

  onSectionLoadFailed(): void {
    this.showOutageNotice = true;
  }

  closeUnavailableVideoModal(): void {
    this.showUnavailableVideoModal = false;
  }

  private handleUnavailableVideo(): void {
    this.directLinkLoading = false;
    this.selectedVideo = null;
    this.modalVariant = 'regular';
    void this.router.navigate(['/'], {
      replaceUrl: true,
      state: {
        showUnavailableVideoModal: true
      } satisfies UnavailableVideoNavigationState
    });
  }

  private consumeUnavailableVideoModalFlag(): void {
    const historyState = history.state as UnavailableVideoNavigationState | null;
    if (historyState?.showUnavailableVideoModal !== true) {
      return;
    }
    this.showUnavailableVideoModal = true;
    this.clearUnavailableVideoModalHistoryFlag();
  }

  private clearUnavailableVideoModalHistoryFlag(): void {
    const currentState = history.state as UnavailableVideoNavigationState | null;
    if (!currentState?.showUnavailableVideoModal) {
      return;
    }
    const nextState = { ...currentState };
    delete nextState.showUnavailableVideoModal;
    history.replaceState(nextState, '', window.location.href);
  }

  private maybeRecordVideoOpenStat(video: Video): void {
    const navigation = this.router.lastSuccessfulNavigation;
    const navigationId = navigation?.id ?? null;
    if (navigationId == null || this.videoStatRecordedForNavigationId === navigationId) {
      return;
    }
    const state = this.resolveNavigationState();
    const trigger = navigation?.trigger ?? 'imperative';
    if (!shouldRecordVideoOpenStat(state, trigger)) {
      return;
    }
    this.clickStatService.recordClick('video', video.id);
    this.videoStatRecordedForNavigationId = navigationId;
  }

  private displayVideoModal(video: Video, variant: VideoModalVariant): void {
    this.modalVariant = variant;
    this.selectedVideo = video;
  }

  private clearVideoRouteState(): void {
    this.directLinkLoading = false;
    this.selectedVideo = null;
    this.modalVariant = 'regular';
    this.videoStatRecordedForNavigationId = null;
  }

  private shouldCloseVideoRouteViaHistoryBack(): boolean {
    if (isDocumentReload()) {
      return false;
    }
    const state = this.resolveNavigationState();
    if (state?.videoOpenSource !== 'tile') {
      return false;
    }
    return window.history.length > 1;
  }

  private resolveNavigationState(): VideoRouteNavigationState | undefined {
    return (this.router.lastSuccessfulNavigation?.extras.state ??
      history.state) as VideoRouteNavigationState | undefined;
  }

  private resolveModalVariantFromNavigation(): VideoModalVariant {
    const state = this.resolveNavigationState();
    return state?.modalVariant === 'promoted' ? 'promoted' : 'regular';
  }
}
