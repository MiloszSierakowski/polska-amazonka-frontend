import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchBarComponent } from '../../components/search-bar/search-bar.component';
import { CategoriesComponent } from '../../components/categories/categories.component';
import { VideosGridComponent } from '../../components/videos-grid/videos-grid.component';
import { PromotedVideosSectionComponent } from '../../components/promoted-videos-section/promoted-videos-section.component';
import { VideoModalComponent, VideoModalVariant } from '../../components/video-modal/video-modal.component';
import { Video } from '../../models/video.model';
import { ClickStatService } from '../../services/click-stat.service';
import { ModalNavigationService } from '../../../../core/services/modal-navigation.service';
import { PUBLIC_OUTAGE_MESSAGE } from '../../constants/public-outage.message';

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
export class HomeComponent implements OnDestroy {
  selectedCategoryId: number | null = null;
  selectedVideo: Video | null = null;
  modalVariant: VideoModalVariant = 'regular';
  showOutageNotice = false;
  readonly outageMessage = PUBLIC_OUTAGE_MESSAGE;
  private modalNavigationId: number | null = null;

  constructor(
    private clickStatService: ClickStatService,
    private modalNavigationService: ModalNavigationService
  ) {}

  ngOnDestroy(): void {
    this.modalNavigationId = this.modalNavigationService.unregister(this.modalNavigationId);
  }

  onCategorySelected(categoryId: number | null): void {
    this.selectedCategoryId = categoryId;
  }

  openVideoModal(video: Video, variant: VideoModalVariant = 'regular'): void {
    this.clickStatService.recordClick('video', video.id);
    this.modalVariant = variant;
    this.selectedVideo = video;
    this.modalNavigationId = this.modalNavigationService.open(() => this.closeModal(true));
  }

  closeModal(fromNavigation = false): void {
    if (!fromNavigation) {
      this.modalNavigationId = this.modalNavigationService.close(this.modalNavigationId);
    } else {
      this.modalNavigationId = null;
    }
    this.selectedVideo = null;
    this.modalVariant = 'regular';
  }

  onSectionLoadFailed(): void {
    this.showOutageNotice = true;
  }
}
