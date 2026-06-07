import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CategoryService } from '../../../../services/category.service';
import { Category } from '../../../public/models/category.model';
import { ToastService } from '../../../../core/admin/toast.service';

interface ApiErrorBody {
  errorCode?: string;
}

@Component({
  selector: 'app-admin-categories-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DragDropModule],
  templateUrl: './admin-categories-section.component.html',
  styleUrl: './admin-categories-section.component.scss'
})
export class AdminCategoriesSectionComponent implements OnInit, OnDestroy {
  items: Category[] = [];
  editingId: number | null = null;
  selectedFile: File | null = null;
  selectedFileName = '';
  previewUrl: string | null = null;
  shopCategoryLockModalOpen = false;
  lockedCategoryName = '';
  isSavingOrder = false;

  form = this.fb.group({
    name: ['', Validators.required]
  });

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private toastService: ToastService,
    @Inject('BACKEND_URL') private backendUrl: string
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.revokePreview();
  }

  startAdd(): void {
    this.editingId = null;
    this.form.reset({ name: '' });
    this.clearImageSelection();
  }

  startEdit(item: Category): void {
    this.editingId = item.id;
    this.form.patchValue({ name: item.name });
    this.clearImageSelection();
    this.previewUrl = this.categoryService.resolveDisplayImageUrl(item, this.backendUrl);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.setSelectedFile(file);
    input.value = '';
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastService.warning('Nazwa kategorii jest wymagana.');
      return;
    }
    const name = this.form.value.name!;
    if (this.editingId) {
      this.categoryService.update(this.editingId, name, this.selectedFile).subscribe(() => {
        this.toastService.success('Kategoria została zaktualizowana.');
        this.startAdd();
        this.loadCategories();
      });
      return;
    }
    this.categoryService.create(name, this.selectedFile).subscribe(() => {
      this.toastService.success('Kategoria została dodana.');
      this.startAdd();
      this.loadCategories();
    });
  }

  drop(event: CdkDragDrop<Category[]>): void {
    if (event.previousIndex === event.currentIndex || this.isSavingOrder) {
      return;
    }
    moveItemInArray(this.items, event.previousIndex, event.currentIndex);
    this.isSavingOrder = true;
    const orderedIds = this.items.map((item) => item.id);
    this.categoryService.reorder(orderedIds).subscribe({
      next: () => {
        this.isSavingOrder = false;
        this.toastService.success('Kolejność kategorii została zapisana.');
      },
      error: () => {
        this.isSavingOrder = false;
        this.loadCategories();
      }
    });
  }

  deleteCategory(item: Category): void {
    if (item.shopId != null) {
      this.openShopCategoryLockModal(item.name);
      return;
    }
    const confirmed = window.confirm(
      `Czy na pewno usunąć kategorię „${item.name}”? Filmy pozostaną w bazie, zostaną tylko odpięte od tej kategorii.`
    );
    if (!confirmed) {
      return;
    }
    this.categoryService.delete(item.id).subscribe({
      next: () => {
        this.toastService.success('Kategoria została usunięta.');
        if (this.editingId === item.id) {
          this.startAdd();
        }
        this.loadCategories();
      },
      error: (error: HttpErrorResponse) => {
        if (this.isShopCategoryLockedError(error)) {
          this.openShopCategoryLockModal(item.name);
        }
      }
    });
  }

  closeShopCategoryLockModal(): void {
    this.shopCategoryLockModalOpen = false;
    this.lockedCategoryName = '';
  }

  isShopCategory(item: Category): boolean {
    return item.shopId != null;
  }

  openShopCategoryLock(item: Category, event: Event): void {
    event.stopPropagation();
    this.openShopCategoryLockModal(item.name);
  }

  imageSrc(item: Category): string {
    return this.categoryService.resolveDisplayImageUrl(item, this.backendUrl);
  }

  private openShopCategoryLockModal(categoryName: string): void {
    this.lockedCategoryName = categoryName;
    this.shopCategoryLockModalOpen = true;
  }

  private isShopCategoryLockedError(error: HttpErrorResponse): boolean {
    if (error.status !== 400) {
      return false;
    }
    const body = (error.error ?? {}) as ApiErrorBody;
    return body.errorCode === 'SHOP_CATEGORY_LOCKED';
  }

  private loadCategories(): void {
    this.categoryService.getCategories().subscribe((categories) => {
      this.items = categories;
    });
  }

  private setSelectedFile(file: File | null): void {
    this.revokePreview();
    this.selectedFile = file;
    this.selectedFileName = file?.name ?? '';
    if (file) {
      this.previewUrl = URL.createObjectURL(file);
    }
  }

  private clearImageSelection(): void {
    this.selectedFile = null;
    this.selectedFileName = '';
    this.revokePreview();
    this.previewUrl = null;
  }

  private revokePreview(): void {
    if (this.previewUrl && this.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.previewUrl);
    }
  }
}
