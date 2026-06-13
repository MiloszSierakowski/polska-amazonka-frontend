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
  editingCategoryId: number | null = null;
  isCategoryModalOpen = false;
  addSelectedFile: File | null = null;
  addSelectedFileName = '';
  addPreviewUrl: string | null = null;
  editSelectedFile: File | null = null;
  editSelectedFileName = '';
  editPreviewUrl: string | null = null;
  shopCategoryLockModalOpen = false;
  lockedCategoryName = '';
  deleteModalOpen = false;
  deleteTarget: Category | null = null;
  isDeleting = false;
  isSavingOrder = false;

  categoryAddForm = this.fb.group({
    name: ['', Validators.required]
  });

  categoryEditForm = this.fb.group({
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
    this.revokeAddPreview();
    this.revokeEditPreview();
  }

  openAddCategoryModal(): void {
    this.cancelEdit();
    this.categoryAddForm.reset({ name: '' });
    this.clearAddImageSelection();
    this.isCategoryModalOpen = true;
  }

  closeCategoryModal(): void {
    this.isCategoryModalOpen = false;
    this.categoryAddForm.reset({ name: '' });
    this.clearAddImageSelection();
  }

  startEdit(item: Category): void {
    if (this.editingCategoryId === item.id) {
      this.cancelEdit();
      return;
    }
    this.editingCategoryId = item.id;
    this.categoryEditForm.reset({ name: item.name });
    this.clearEditImageSelection();
    this.editPreviewUrl = this.categoryService.resolveDisplayImageUrl(item, this.backendUrl);
  }

  cancelEdit(): void {
    this.editingCategoryId = null;
    this.categoryEditForm.reset({ name: '' });
    this.clearEditImageSelection();
  }

  onAddFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.setAddSelectedFile(file);
    input.value = '';
  }

  onEditFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.setEditSelectedFile(file);
    input.value = '';
  }

  saveNewCategory(): void {
    if (this.categoryAddForm.invalid) {
      this.categoryAddForm.markAllAsTouched();
      this.toastService.warning('Nazwa kategorii jest wymagana.');
      return;
    }
    const name = this.categoryAddForm.value.name!;
    this.categoryService.create(name, this.addSelectedFile).subscribe(() => {
      this.toastService.success('Kategoria została dodana.');
      this.closeCategoryModal();
      this.loadCategories();
    });
  }

  saveEditCategory(item: Category): void {
    if (this.categoryEditForm.invalid) {
      this.categoryEditForm.markAllAsTouched();
      this.toastService.warning('Nazwa kategorii jest wymagana.');
      return;
    }
    const name = this.categoryEditForm.value.name!;
    this.categoryService.update(item.id, name, this.editSelectedFile).subscribe(() => {
      this.toastService.success('Kategoria została zaktualizowana.');
      this.cancelEdit();
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
    this.deleteTarget = item;
    this.deleteModalOpen = true;
  }

  cancelDelete(): void {
    if (this.isDeleting) {
      return;
    }
    this.deleteModalOpen = false;
    this.deleteTarget = null;
  }

  confirmDelete(): void {
    const item = this.deleteTarget;
    if (!item || this.isDeleting) {
      return;
    }
    this.isDeleting = true;
    this.categoryService.delete(item.id).subscribe({
      next: () => {
        this.isDeleting = false;
        this.deleteModalOpen = false;
        this.deleteTarget = null;
        this.toastService.success('Kategoria została usunięta.');
        if (this.editingCategoryId === item.id) {
          this.cancelEdit();
        }
        this.loadCategories();
      },
      error: (error: HttpErrorResponse) => {
        this.isDeleting = false;
        if (this.isShopCategoryLockedError(error)) {
          this.deleteModalOpen = false;
          this.deleteTarget = null;
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

  private setAddSelectedFile(file: File | null): void {
    this.revokeAddPreview();
    this.addSelectedFile = file;
    this.addSelectedFileName = file?.name ?? '';
    if (file) {
      this.addPreviewUrl = URL.createObjectURL(file);
    }
  }

  private setEditSelectedFile(file: File | null): void {
    this.revokeEditPreview();
    this.editSelectedFile = file;
    this.editSelectedFileName = file?.name ?? '';
    if (file) {
      this.editPreviewUrl = URL.createObjectURL(file);
    }
  }

  private clearAddImageSelection(): void {
    this.addSelectedFile = null;
    this.addSelectedFileName = '';
    this.revokeAddPreview();
    this.addPreviewUrl = null;
  }

  private clearEditImageSelection(): void {
    this.editSelectedFile = null;
    this.editSelectedFileName = '';
    this.revokeEditPreview();
    this.editPreviewUrl = null;
  }

  private revokeAddPreview(): void {
    if (this.addPreviewUrl && this.addPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.addPreviewUrl);
    }
  }

  private revokeEditPreview(): void {
    if (this.editPreviewUrl && this.editPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.editPreviewUrl);
    }
  }
}
