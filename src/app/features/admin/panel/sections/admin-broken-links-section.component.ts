import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import {
  BrokenLinkProduct,
  BrokenLinkVideoGroup,
  ProductLinkReviewStatus
} from '../../models/broken-link.model';
import { BrokenLinkService } from '../../services/broken-link.service';
import { BrokenLinkRefreshService } from '../../services/broken-link-refresh.service';
import {
  ProductLinkVerificationStatus,
  ProductLinkVerifyResult,
  resolveProductLinkVerificationStatus,
  VideoService
} from '../../../public/services/video.service';
import { ToastService } from '../../../../core/admin/toast.service';

@Component({
  selector: 'app-admin-broken-links-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-broken-links-section.component.html',
  styleUrl: './admin-broken-links-section.component.scss'
})
export class AdminBrokenLinksSectionComponent implements OnInit, OnChanges, OnDestroy {
  @Input() active = false;

  groups: BrokenLinkVideoGroup[] = [];
  productCount = 0;
  openedVideoId: number | null = null;
  isLoading = false;
  hasLoadError = false;
  flaggingKey: string | null = null;
  verifyModalOpen = false;
  verifyLoading = false;
  verifyResult: ProductLinkVerifyResult | null = null;
  verifyErrorMessage: string | null = null;
  verifyVideoId: number | null = null;
  verifyProductId: number | null = null;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private brokenLinkService: BrokenLinkService,
    private brokenLinkRefreshService: BrokenLinkRefreshService,
    private videoService: VideoService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.brokenLinkRefreshService.refreshRequested$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadItems());
    this.loadItems();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['active']?.currentValue === true && !changes['active'].firstChange) {
      this.loadItems();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackGroup(_index: number, group: BrokenLinkVideoGroup): number {
    return group.videoId;
  }

  trackProduct(_index: number, item: BrokenLinkProduct): number {
    return item.productId;
  }

  isVideoOpen(group: BrokenLinkVideoGroup): boolean {
    return this.openedVideoId === group.videoId;
  }

  toggleVideo(group: BrokenLinkVideoGroup): void {
    this.openedVideoId = this.isVideoOpen(group) ? null : group.videoId;
  }

  videoPreviewSrc(group: BrokenLinkVideoGroup): string {
    return this.videoService.resolvePreviewImageUrl(group.videoPreviewImageUrl);
  }

  productImageSrc(imageUrl: string | null): string {
    return this.videoService.resolveProductImageUrl(imageUrl);
  }

  linkPlatformLabel(url: string): string {
    try {
      const host = new URL(url).hostname.replace(/^www\./i, '').toLowerCase();
      if (host.includes('aliexpress')) {
        return 'AliExpress';
      }
      if (host.includes('allegro')) {
        return 'Allegro';
      }
      if (host.includes('temu')) {
        return 'Temu';
      }
      if (host.includes('amazon')) {
        return 'Amazon';
      }
      return host;
    } catch {
      return 'Sklep';
    }
  }

  linkStatus(item: BrokenLinkProduct): ProductLinkReviewStatus {
    if (item.isBroken) {
      return 'broken';
    }
    if (item.needsReview) {
      return 'needs_review';
    }
    return 'working';
  }

  isFlagging(item: BrokenLinkProduct): boolean {
    return this.flaggingKey === this.itemKey(item);
  }

  setLinkStatus(item: BrokenLinkProduct, status: ProductLinkReviewStatus): void {
    if (this.linkStatus(item) === status || this.isFlagging(item)) {
      return;
    }
    const key = this.itemKey(item);
    this.flaggingKey = key;
    this.videoService.setProductLinkReviewStatus(item.videoId, item.productId, status).subscribe({
      next: () => {
        this.flaggingKey = null;
        if (status === 'working') {
          this.removeProduct(item);
          this.toastService.success(
            'Oznaczono jako sprawny. Automat ponownie sprawdzi link podczas nocnej weryfikacji.'
          );
        } else {
          item.isBroken = status === 'broken';
          item.needsReview = status === 'needs_review';
          const message =
            status === 'broken'
              ? 'Oznaczono link jako niesprawny.'
              : 'Oznaczono link jako wymagający ręcznej weryfikacji.';
          this.toastService.success(message);
        }
        this.brokenLinkRefreshService.requestRefresh();
      },
      error: () => {
        this.flaggingKey = null;
        this.toastService.warning('Nie udało się zapisać statusu linku.');
      }
    });
  }

  openVerifyModal(item: BrokenLinkProduct): void {
    if (this.verifyLoading) {
      return;
    }
    this.verifyVideoId = item.videoId;
    this.verifyProductId = item.productId;
    this.verifyResult = null;
    this.verifyErrorMessage = null;
    this.verifyLoading = true;
    this.verifyModalOpen = true;
    this.videoService.verifyProductLink(item.videoId, item.productId).subscribe({
      next: (result) => {
        this.verifyLoading = false;
        this.verifyResult = result;
        if (resolveProductLinkVerificationStatus(result) === 'WORKING') {
          this.removeProduct(item);
        } else {
          item.isBroken = result.isBroken;
          item.needsReview = result.needsReview ?? result.verificationUncertain ?? false;
        }
        this.brokenLinkRefreshService.requestRefresh();
      },
      error: () => {
        this.verifyLoading = false;
        this.verifyErrorMessage = 'Nie udało się zweryfikować linku produktu. Spróbuj ponownie później.';
        this.toastService.warning(this.verifyErrorMessage);
      }
    });
  }

  closeVerifyModal(): void {
    this.verifyModalOpen = false;
    this.verifyLoading = false;
    this.verifyResult = null;
    this.verifyErrorMessage = null;
    this.verifyVideoId = null;
    this.verifyProductId = null;
    this.loadItems();
  }

  verifyStatus(result: ProductLinkVerifyResult): ProductLinkVerificationStatus {
    return resolveProductLinkVerificationStatus(result);
  }

  verifyStatusTitle(result: ProductLinkVerifyResult): string {
    switch (this.verifyStatus(result)) {
      case 'WORKING':
        return 'Link działa';
      case 'BROKEN':
        return 'Link jest niedostępny lub nieprawidłowy';
      case 'UNCERTAIN':
        return 'Wynik kontroli jest niejednoznaczny';
      case 'BLOCKED':
        return 'Sklep zablokował automatyczną kontrolę';
      case 'TECHNICAL_ERROR':
        return 'Automatyczna kontrola nie powiodła się';
    }
  }

  verifyStatusHint(result: ProductLinkVerifyResult): string {
    switch (this.verifyStatus(result)) {
      case 'WORKING':
        return 'Link sprawny — zniknie z tej listy po zamknięciu okna.';
      case 'BROKEN':
        return 'Link pozostaje na liście do naprawy.';
      case 'UNCERTAIN':
        return 'Ustaw status ręcznie albo sprawdź link w przeglądarce.';
      case 'BLOCKED':
        return 'Nie potwierdzono uszkodzenia linku. Sprawdź go ręcznie w przeglądarce.';
      case 'TECHNICAL_ERROR':
        return result.verificationMessage?.trim()
          || 'Nie udało się wykonać automatycznej kontroli. Link wymaga ręcznej weryfikacji.';
    }
  }

  verifyStoreImageSrc(imageUrl: string | null | undefined): string {
    return this.videoService.resolveProductImageUrl(imageUrl ?? null);
  }

  private itemKey(item: BrokenLinkProduct): string {
    return `${item.videoId}-${item.productId}`;
  }

  private removeProduct(item: BrokenLinkProduct): void {
    this.groups = this.groups
      .map((group) => ({
        ...group,
        products: group.products.filter(
          (entry) => entry.videoId !== item.videoId || entry.productId !== item.productId
        )
      }))
      .filter((group) => group.products.length > 0);
    this.productCount = this.countProducts(this.groups);
    if (this.openedVideoId === item.videoId && !this.groups.some((g) => g.videoId === item.videoId)) {
      this.openedVideoId = null;
    }
  }

  private loadItems(): void {
    this.isLoading = true;
    this.hasLoadError = false;
    this.brokenLinkService.getAll().subscribe({
      next: (items) => {
        this.isLoading = false;
        this.groups = this.buildGroups(items);
        this.productCount = this.countProducts(this.groups);
        if (this.openedVideoId != null && !this.groups.some((g) => g.videoId === this.openedVideoId)) {
          this.openedVideoId = null;
        }
      },
      error: () => {
        this.isLoading = false;
        this.hasLoadError = true;
        this.groups = [];
        this.productCount = 0;
        this.openedVideoId = null;
      }
    });
  }

  private buildGroups(items: BrokenLinkProduct[]): BrokenLinkVideoGroup[] {
    const byVideo = new Map<number, BrokenLinkVideoGroup>();
    for (const item of items) {
      let group = byVideo.get(item.videoId);
      if (!group) {
        group = {
          videoId: item.videoId,
          videoTitle: item.videoTitle,
          videoPreviewImageUrl: item.videoPreviewImageUrl,
          products: []
        };
        byVideo.set(item.videoId, group);
      }
      group.products.push(item);
    }
    return Array.from(byVideo.values()).sort((left, right) =>
      left.videoTitle.localeCompare(right.videoTitle, 'pl', { sensitivity: 'base' })
    );
  }

  private countProducts(groups: BrokenLinkVideoGroup[]): number {
    return groups.reduce((total, group) => total + group.products.length, 0);
  }
}
