import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MOCK_ADMIN_DISCOUNTS, AdminDiscountMock } from '../../mocks/admin-mock.data';

@Component({
  selector: 'app-admin-discounts-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-discounts-section.component.html',
  styleUrl: './admin-discounts-section.component.scss'
})
export class AdminDiscountsSectionComponent {
  items: AdminDiscountMock[] = [...MOCK_ADMIN_DISCOUNTS];
  editingId: number | null = null;

  form = this.fb.group({
    platform: ['', Validators.required],
    codeValue: ['', Validators.required],
    type: ['DISCOUNT' as 'AFFILIATE' | 'DISCOUNT', Validators.required],
    isActive: [true]
  });

  constructor(private fb: FormBuilder) {}

  startAdd(): void {
    this.editingId = null;
    this.form.reset({ platform: '', codeValue: '', type: 'DISCOUNT', isActive: true });
  }

  startEdit(item: AdminDiscountMock): void {
    this.editingId = item.id;
    this.form.patchValue({
      platform: item.platform,
      codeValue: item.codeValue,
      type: item.type,
      isActive: item.isActive
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    if (this.editingId) {
      this.items = this.items.map((item) =>
        item.id === this.editingId
          ? {
              ...item,
              platform: value.platform!,
              codeValue: value.codeValue!,
              type: value.type!,
              isActive: value.isActive ?? true
            }
          : item
      );
    } else {
      const nextId = Math.max(0, ...this.items.map((i) => i.id)) + 1;
      this.items = [
        ...this.items,
        {
          id: nextId,
          platform: value.platform!,
          codeValue: value.codeValue!,
          type: value.type!,
          isActive: value.isActive ?? true
        }
      ];
    }
    this.startAdd();
  }
}
