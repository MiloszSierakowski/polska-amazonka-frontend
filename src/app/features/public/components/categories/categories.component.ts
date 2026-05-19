import { Component, EventEmitter, Inject, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoryService } from '../../../../services/category.service';
import { Category } from '../../models/category.model';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss'
})
export class CategoriesComponent implements OnInit {
  categories: Category[] = [];
  selectedCategoryId: number | null = null;

  @Output() categorySelected = new EventEmitter<number | null>();

  constructor(
    private categoryService: CategoryService,
    @Inject('BACKEND_URL') private backendUrl: string
  ) {}

  ngOnInit(): void {
    this.categoryService.getCategories().subscribe({
      next: (data) => {
        this.categories = data.map((category) => ({
          ...category,
          imageUrl: this.resolveImageUrl(category)
        }));
      },
      error: (err) => console.error('Błąd pobierania kategorii', err)
    });
  }

  onWheel(event: WheelEvent): void {
    const scrollContainer = event.currentTarget as HTMLElement;
    if (!scrollContainer) return;
    event.preventDefault();
    scrollContainer.scrollLeft += event.deltaY;
  }

  selectCategory(id: number): void {
    this.selectedCategoryId = this.selectedCategoryId === id ? null : id;
    this.categorySelected.emit(this.selectedCategoryId);
  }

  private resolveImageUrl(category: Category): string {
    if (!category.imageUrl) {
      return `${this.backendUrl}/categories/${this.categoryAssetName(category.name)}.png`;
    }
    if (category.imageUrl.startsWith('http://') || category.imageUrl.startsWith('https://')) {
      return category.imageUrl;
    }
    return `${this.backendUrl}${category.imageUrl.startsWith('/') ? '' : '/'}${category.imageUrl}`;
  }

  private categoryAssetName(name: string): string {
    return name.toLowerCase()
      .replace('ę', 'e')
      .replace('ą', 'a')
      .replace('ł', 'l')
      .replace('ó', 'o')
      .replace('ś', 's')
      .replace('ć', 'c')
      .replace('ń', 'n')
      .replace('ż', 'z')
      .replace('ź', 'z');
  }
}
