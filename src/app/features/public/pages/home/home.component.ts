import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchBarComponent } from '../../components/search-bar/search-bar.component';
import { CategoriesComponent } from '../../components/categories/categories.component';
import { DiscountSectionComponent } from '../../components/discount-section/discount-section.component';
import { VideosGridComponent } from '../../components/videos-grid/videos-grid.component';
import { PUBLIC_OUTAGE_MESSAGE } from '../../constants/public-outage.message';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [
    CommonModule,
    SearchBarComponent,
    DiscountSectionComponent,
    CategoriesComponent,
    VideosGridComponent
  ]
})
export class HomeComponent {
  selectedCategoryId: number | null = null;
  showOutageNotice = false;
  readonly outageMessage = PUBLIC_OUTAGE_MESSAGE;

  onCategorySelected(categoryId: number | null): void {
    this.selectedCategoryId = categoryId;
  }

  onSectionLoadFailed(): void {
    this.showOutageNotice = true;
  }
}
