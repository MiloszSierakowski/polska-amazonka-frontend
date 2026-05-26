import { Component, EventEmitter, Inject, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoryService } from '../../../../services/category.service';
import { Category } from '../../models/category.model';

interface CategoryView extends Category {
  displayImageUrl: string;
}

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss'
})
export class CategoriesComponent implements OnInit {
  categories: CategoryView[] = [];
  selectedCategoryId: number | null = null;

  @Output() categorySelected = new EventEmitter<number | null>();

  constructor(
    private categoryService: CategoryService,
    @Inject('BACKEND_URL') private backendUrl: string
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  onWheel(event: WheelEvent): void {
    const scrollContainer = event.currentTarget as HTMLElement;
    if (!scrollContainer) {
      return;
    }
    event.preventDefault();
    scrollContainer.scrollLeft += event.deltaY;
  }

  selectCategory(id: number): void {
    this.selectedCategoryId = this.selectedCategoryId === id ? null : id;
    this.categorySelected.emit(this.selectedCategoryId);
  }

  trackByCategoryId(_index: number, category: CategoryView): number {
    return category.id;
  }

  onImageError(event: Event, category: CategoryView): void {
    const img = event.target as HTMLImageElement;
    img.onerror = null;
    img.src = this.categoryService.resolveDisplayImageUrl(
      { id: category.id, name: category.name, imageUrl: null },
      this.backendUrl
    );
  }

  private loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (data) => {
        this.categories = (data ?? []).map((category) => this.toCategoryView(category));
      }
    });
  }

  private toCategoryView(category: Category): CategoryView {
    return {
      ...category,
      displayImageUrl: this.categoryService.resolveDisplayImageUrl(category, this.backendUrl)
    };
  }
}
