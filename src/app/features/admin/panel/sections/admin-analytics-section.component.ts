import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { forkJoin } from 'rxjs';
import { AnalyticsService, ClickStatAggregation } from '../../services/analytics.service';
import { DiscountCodeService } from '../../services/discount-code.service';
import { DiscountCode } from '../../models/discount-code.model';
import { VideoService } from '../../../public/services/video.service';
import { CategoryService } from '../../../../services/category.service';
import { ShopService } from '../../../../core/services/shop.service';

type AnalyticsRange = 'today' | 'yesterday' | '7days' | 'currentMonth' | 'custom';

interface AnalyticsRankingItem {
  id: number;
  name: string;
  clickCount: number;
  imageUrl: string | null;
  progressPercent: number;
}

@Component({
  selector: 'app-admin-analytics-section',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './admin-analytics-section.component.html',
  styleUrl: './admin-analytics-section.component.scss'
})
export class AdminAnalyticsSectionComponent implements OnInit {
  activeRange: AnalyticsRange = '7days';
  isDateRangeOpen = false;
  customFromDate = '';
  customToDate = '';
  isLoading = false;
  hasLoadError = false;
  hasProductListData = false;
  hasCategoryChartData = false;
  hasShopChartData = false;
  hasVideoListData = false;

  readonly emptyStateMessage =
    'Jeszcze nikt tu nie kliknął. Udostępnij swoje linki, aby zobaczyć pierwsze statystyki!';

  productRankingItems: AnalyticsRankingItem[] = [];
  videoRankingItems: AnalyticsRankingItem[] = [];

  categoryDoughnutChartData: ChartConfiguration<'doughnut'>['data'] = this.createEmptyDoughnutData();
  shopDoughnutChartData: ChartConfiguration<'doughnut'>['data'] = this.createEmptyDoughnutData();

  categoryDoughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = this.buildDoughnutChartOptions();
  shopDoughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = this.buildDoughnutChartOptions();

  private productNames = new Map<number, string>();
  private productImages = new Map<number, string>();
  private videoNames = new Map<number, string>();
  private videoImages = new Map<number, string>();
  private categoryNames = new Map<number, string>();
  private shopNames = new Map<number, string>();
  private discountCodes: DiscountCode[] = [];
  private readonly brokenImages = new Set<string>();
  private customRangeFrom: Date | null = null;
  private customRangeTo: Date | null = null;

  constructor(
    private analyticsService: AnalyticsService,
    private videoService: VideoService,
    private categoryService: CategoryService,
    private shopService: ShopService,
    private discountCodeService: DiscountCodeService
  ) {}

  ngOnInit(): void {
    this.loadReferenceData();
  }

  setRange(range: AnalyticsRange): void {
    this.activeRange = range;
    this.isDateRangeOpen = false;
    this.loadStats();
  }

  isRangeActive(range: AnalyticsRange): boolean {
    return this.activeRange === range;
  }

  toggleDateRangePicker(): void {
    this.isDateRangeOpen = !this.isDateRangeOpen;
    if (this.isDateRangeOpen) {
      this.customFromDate = this.formatInputDate(this.customRangeFrom ?? this.startOfToday());
      this.customToDate = this.formatInputDate(this.customRangeTo ?? new Date());
    }
  }

  onWheel(event: WheelEvent): void {
    const scrollContainer = event.currentTarget as HTMLElement;
    if (!scrollContainer) {
      return;
    }
    event.preventDefault();
    scrollContainer.scrollLeft += event.deltaY;
  }

  applyCustomRange(): void {
    if (!this.customFromDate || !this.customToDate) {
      return;
    }

    const from = this.parseInputDate(this.customFromDate);
    const to = this.parseInputDate(this.customToDate);
    if (from.getTime() > to.getTime()) {
      return;
    }

    this.customRangeFrom = from;
    this.customRangeTo = to;
    this.activeRange = 'custom';
    this.isDateRangeOpen = false;
    this.loadStats();
  }

  onRankingImageError(imageKey: string): void {
    this.brokenImages.add(imageKey);
  }

  isRankingImageBroken(imageKey: string): boolean {
    return this.brokenImages.has(imageKey);
  }

  private loadReferenceData(): void {
    forkJoin({
      categories: this.categoryService.getCategories(),
      videos: this.videoService.getVideos(),
      shops: this.shopService.getAll(),
      discountCodes: this.discountCodeService.getAll()
    }).subscribe({
      next: ({ categories, videos, shops, discountCodes }) => {
        this.productNames.clear();
        this.productImages.clear();
        this.videoNames.clear();
        this.videoImages.clear();
        this.categoryNames.clear();
        this.shopNames.clear();
        this.brokenImages.clear();
        this.discountCodes = discountCodes;

        for (const category of categories) {
          this.categoryNames.set(category.id, category.name);
        }
        for (const shop of shops) {
          this.shopNames.set(shop.id, shop.name);
        }
        for (const video of videos) {
          this.videoNames.set(video.id, video.title);
          this.videoImages.set(video.id, video.previewImageUrl);
          for (const product of video.products) {
            this.productNames.set(product.id, product.name);
            this.productImages.set(product.id, product.imageUrl);
          }
        }
        this.loadStats();
      },
      error: () => {
        this.loadStats();
      }
    });
  }

  private loadStats(): void {
    const { from, to } = this.resolveRange();
    this.isLoading = true;
    this.hasLoadError = false;

    this.analyticsService.getStats(from, to).subscribe({
      next: (rows) => {
        this.isLoading = false;
        this.applyStats(rows);
      },
      error: () => {
        this.isLoading = false;
        this.hasLoadError = true;
        this.applyStats([]);
      }
    });
  }

  private applyStats(rows: ClickStatAggregation[]): void {
    this.updateProductRanking(rows);
    this.updateVideoRanking(rows);
    this.updateCategoryChart(rows);
    this.updateShopChart(rows);
  }

  private updateProductRanking(rows: ClickStatAggregation[]): void {
    const productRows = rows
      .filter((row) => this.matchesEntityType(row, 'product') && this.productNames.has(row.entityId))
      .sort((a, b) => b.clickCount - a.clickCount)
      .slice(0, 10);

    this.productRankingItems = this.buildRankingItems(
      productRows,
      (id) => this.productLabel(id),
      (id) => this.productImages.get(id) ?? null
    );
    this.hasProductListData = this.productRankingItems.length > 0;
  }

  private updateVideoRanking(rows: ClickStatAggregation[]): void {
    const videoRows = rows
      .filter((row) => this.matchesEntityType(row, 'video') && this.videoNames.has(row.entityId))
      .sort((a, b) => b.clickCount - a.clickCount)
      .slice(0, 10);

    this.videoRankingItems = this.buildRankingItems(
      videoRows,
      (id) => this.videoLabel(id),
      (id) => this.videoImages.get(id) ?? null
    );
    this.hasVideoListData = this.videoRankingItems.length > 0;
  }

  private buildRankingItems(
    rows: ClickStatAggregation[],
    labelFor: (id: number) => string,
    imageFor: (id: number) => string | null
  ): AnalyticsRankingItem[] {
    const topCount = rows[0]?.clickCount ?? 0;

    return rows.map((row) => ({
      id: row.entityId,
      name: labelFor(row.entityId),
      clickCount: row.clickCount,
      imageUrl: imageFor(row.entityId),
      progressPercent: topCount > 0 ? (row.clickCount / topCount) * 100 : 0
    }));
  }

  private updateCategoryChart(rows: ClickStatAggregation[]): void {
    const categoryTotals = new Map<string, number>();

    for (const row of rows) {
      if (!this.matchesEntityType(row, 'category') || !this.categoryNames.has(row.entityId)) {
        continue;
      }
      const categoryLabel = this.categoryLabel(row.entityId);
      categoryTotals.set(categoryLabel, (categoryTotals.get(categoryLabel) ?? 0) + row.clickCount);
    }

    const sortedCategories = [...categoryTotals.entries()].sort((a, b) => b[1] - a[1]);
    this.hasCategoryChartData = sortedCategories.length > 0;
    this.categoryDoughnutChartData = this.buildDoughnutData(sortedCategories);
  }

  private updateShopChart(rows: ClickStatAggregation[]): void {
    const shopTotals = new Map<string, number>();

    for (const row of rows) {
      if (this.matchesEntityType(row, 'discount_code')) {
        const discountCode = this.discountCodes.find((code) => code.id === row.entityId);
        const shopLabel = discountCode?.shopName?.trim() || `Sklep #${discountCode?.shopId ?? row.entityId}`;
        shopTotals.set(shopLabel, (shopTotals.get(shopLabel) ?? 0) + row.clickCount);
        continue;
      }

      if (this.matchesEntityType(row, 'shop') && this.shopNames.has(row.entityId)) {
        const shopLabel = this.shopLabel(row.entityId);
        shopTotals.set(shopLabel, (shopTotals.get(shopLabel) ?? 0) + row.clickCount);
      }
    }

    const sortedShops = [...shopTotals.entries()].sort((a, b) => b[1] - a[1]);
    this.hasShopChartData = sortedShops.length > 0;
    this.shopDoughnutChartData = this.buildDoughnutData(sortedShops);
  }

  private buildDoughnutData(entries: Array<[string, number]>): ChartConfiguration<'doughnut'>['data'] {
    return {
      labels: entries.map(([label]) => label),
      datasets: [
        {
          data: entries.map(([, count]) => count),
          backgroundColor: ['#1a7bb8', '#309fe5', '#5eb8f0', '#94d3fb', '#0f5f8a', '#64748b', '#334155', '#cbd5e1'],
          borderColor: '#fff',
          borderWidth: 2
        }
      ]
    };
  }

  private createEmptyDoughnutData(): ChartConfiguration<'doughnut'>['data'] {
    return {
      labels: [],
      datasets: [
        {
          data: [],
          backgroundColor: ['#1a7bb8', '#309fe5', '#5eb8f0', '#94d3fb', '#0f5f8a', '#64748b'],
          borderColor: '#fff',
          borderWidth: 2
        }
      ]
    };
  }

  private buildDoughnutChartOptions(): ChartConfiguration<'doughnut'>['options'] {
    return {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          bottom: 8
        }
      },
      plugins: {
        legend: {
          position: 'bottom',
          align: 'center',
          labels: {
            boxWidth: 12,
            boxHeight: 12,
            padding: 14,
            font: {
              size: 11
            }
          }
        }
      }
    };
  }

  private matchesEntityType(row: ClickStatAggregation, type: string): boolean {
    return row.entityType.toLowerCase() === type.toLowerCase();
  }

  private productLabel(productId: number): string {
    return this.productNames.get(productId)?.trim() || `Produkt #${productId}`;
  }

  private videoLabel(videoId: number): string {
    return this.videoNames.get(videoId)?.trim() || `Film #${videoId}`;
  }

  private categoryLabel(categoryId: number): string {
    return this.categoryNames.get(categoryId)?.trim() || `Kategoria #${categoryId}`;
  }

  private shopLabel(shopId: number): string {
    return this.shopNames.get(shopId)?.trim() || `Sklep #${shopId}`;
  }

  private resolveRange(): { from: Date; to: Date } {
    const now = new Date();

    if (this.activeRange === 'custom' && this.customRangeFrom && this.customRangeTo) {
      return {
        from: this.startOfDay(this.customRangeFrom),
        to: this.endOfDay(this.customRangeTo)
      };
    }

    if (this.activeRange === 'today') {
      return {
        from: this.startOfToday(),
        to: now
      };
    }

    if (this.activeRange === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        from: this.startOfDay(yesterday),
        to: this.endOfDay(yesterday)
      };
    }

    if (this.activeRange === '7days') {
      const from = new Date();
      from.setDate(from.getDate() - 6);
      return {
        from: this.startOfDay(from),
        to: now
      };
    }

    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      from: this.startOfDay(from),
      to: now
    };
  }

  private startOfToday(): Date {
    return this.startOfDay(new Date());
  }

  private startOfDay(date: Date): Date {
    const value = new Date(date);
    value.setHours(0, 0, 0, 0);
    return value;
  }

  private endOfDay(date: Date): Date {
    const value = new Date(date);
    value.setHours(23, 59, 59, 999);
    return value;
  }

  private formatInputDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private parseInputDate(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
}
