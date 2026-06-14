import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  PublicProductSearchService,
  PublicSearchProduct
} from '../../services/public-product-search.service';
import { VideoService } from '../../services/video.service';
import { ClickStatService } from '../../services/click-stat.service';
import {
  Subscription,
  debounceTime,
  distinctUntilChanged,
  of,
  switchMap,
  tap
} from 'rxjs';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss']
})
export class SearchBarComponent implements OnInit, OnDestroy {
  readonly searchControl = new FormControl('', { nonNullable: true });

  searchResults: PublicSearchProduct[] = [];
  isSearching = false;

  get hasSearchText(): boolean {
    return this.searchControl.value.trim().length > 0;
  }

  private subscription?: Subscription;

  constructor(
    private publicProductSearchService: PublicProductSearchService,
    private videoService: VideoService,
    private clickStatService: ClickStatService
  ) {}

  ngOnInit(): void {
    this.subscription = this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap((value) => {
          if (!value.trim()) {
            this.searchResults = [];
            this.isSearching = false;
          }
        }),
        switchMap((value) => {
          const term = value.trim();
          if (!term) {
            return of([]);
          }
          this.isSearching = true;
          return this.publicProductSearchService.search(term);
        })
      )
      .subscribe({
        next: (results) => {
          this.searchResults = results;
          this.isSearching = false;
        },
        error: () => {
          this.searchResults = [];
          this.isSearching = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  clearSearch(): void {
    this.searchControl.setValue('');
    this.searchResults = [];
    this.isSearching = false;
  }

  productRedirectUrl(productId: number): string {
    return this.publicProductSearchService.resolveRedirectUrl(productId);
  }

  productImageSrc(imageUrl: string | null | undefined): string {
    return this.videoService.resolveProductImageUrl(imageUrl);
  }

  onProductClick(productId: number): void {
    this.clickStatService.recordClick('product', productId);
  }
}
