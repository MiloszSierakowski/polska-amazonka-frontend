import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MOCK_ADMIN_CATEGORIES, AdminCategoryMock } from '../../mocks/admin-mock.data';

@Component({
  selector: 'app-admin-categories-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-categories-section.component.html',
  styleUrl: './admin-categories-section.component.scss'
})
export class AdminCategoriesSectionComponent {
  items: AdminCategoryMock[] = [...MOCK_ADMIN_CATEGORIES];
  editingId: number | null = null;

  form = this.fb.group({
    name: ['', Validators.required]
  });

  constructor(private fb: FormBuilder) {}

  startAdd(): void {
    this.editingId = null;
    this.form.reset({ name: '' });
  }

  startEdit(item: AdminCategoryMock): void {
    this.editingId = item.id;
    this.form.patchValue({ name: item.name });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const name = this.form.value.name!;
    if (this.editingId) {
      this.items = this.items.map((item) =>
        item.id === this.editingId ? { ...item, name } : item
      );
    } else {
      const nextId = Math.max(0, ...this.items.map((i) => i.id)) + 1;
      this.items = [...this.items, { id: nextId, name }];
    }
    this.startAdd();
  }
}
