import { Component, OnInit, Inject } from '@angular/core';
import { CategoryService } from '../../../../services/category.service';
import { Category } from '../../models/category.model';
import { CommonModule } from "@angular/common";

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss'
})
export class CategoriesComponent implements OnInit {

  categories: Category[] = [];

  constructor(
    private categoryService: CategoryService,
    @Inject('BACKEND_URL') private backendUrl: string
  ) {}

  ngOnInit(): void {
    this.categoryService.getCategories().subscribe({
      next: (data) => {
        this.categories = data.map(c => ({
          ...c,
          imageUrl: this.backendUrl + c.imageUrl
        }));
      },
      error: (err) => console.error('Bd pobierania kategorii', err)
    });
  }

  onWheel(event: WheelEvent): void {
    const scrollContainer = event.currentTarget as HTMLElement;
    if (!scrollContainer) return;

    event.preventDefault();
    scrollContainer.scrollLeft += event.deltaY;
  }
}
