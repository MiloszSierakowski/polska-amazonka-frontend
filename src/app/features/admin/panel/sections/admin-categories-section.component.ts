import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoryService } from '../../../../services/category.service';
import { Category } from '../../../public/models/category.model';

@Component({
  selector: 'app-admin-categories-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-categories-section.component.html',
  styleUrl: './admin-categories-section.component.scss'
})
export class AdminCategoriesSectionComponent implements OnInit, OnDestroy {
  items: Category[] = [];
  editingId: number | null = null;
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  form = this.fb.group({
    name: ['', Validators.required]
  });

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
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

  openFilePicker(fileInput: HTMLInputElement): void {
    fileInput.click();
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const name = this.form.value.name!;
    if (this.editingId) {
      this.categoryService.update(this.editingId, name, this.selectedFile).subscribe(() => {
        this.startAdd();
        this.loadCategories();
      });
      return;
    }
    this.categoryService.create(name, this.selectedFile).subscribe(() => {
      this.startAdd();
      this.loadCategories();
    });
  }

  deleteCategory(item: Category): void {
    const confirmed = window.confirm(
      `Czy na pewno usunąć kategorię „${item.name}”? Filmy pozostaną w bazie, zostaną tylko odpięte od tej kategorii.`
    );
    if (!confirmed) {
      return;
    }
    this.categoryService.delete(item.id).subscribe(() => {
      if (this.editingId === item.id) {
        this.startAdd();
      }
      this.loadCategories();
    });
  }

  imageSrc(item: Category): string {
    return this.categoryService.resolveDisplayImageUrl(item, this.backendUrl);
  }

  private loadCategories(): void {
    this.categoryService.getCategories().subscribe((categories) => {
      this.items = categories;
    });
  }

  private setSelectedFile(file: File | null): void {
    this.revokePreview();
    this.selectedFile = file;
    if (file) {
      this.previewUrl = URL.createObjectURL(file);
    }
  }

  private clearImageSelection(): void {
    this.selectedFile = null;
    this.revokePreview();
    this.previewUrl = null;
  }

  private revokePreview(): void {
    if (this.previewUrl && this.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.previewUrl);
    }
  }

}
