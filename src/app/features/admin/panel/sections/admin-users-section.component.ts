import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MOCK_ADMIN_USERS } from '../../mocks/admin-mock.data';
import { AdminUser } from '../../models/admin-user.model';

@Component({
  selector: 'app-admin-users-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-users-section.component.html',
  styleUrl: './admin-users-section.component.scss'
})
export class AdminUsersSectionComponent {
  items: AdminUser[] = [...MOCK_ADMIN_USERS];
  editingId: number | null = null;

  form = this.fb.group({
    login: ['', Validators.required],
    role: ['WORKER' as 'ADMIN' | 'WORKER', Validators.required]
  });

  constructor(private fb: FormBuilder) {}

  startAdd(): void {
    this.editingId = null;
    this.form.reset({ login: '', role: 'WORKER' });
  }

  startEdit(item: AdminUser): void {
    this.editingId = item.id;
    this.form.patchValue({ login: item.login, role: item.role });
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
          ? { ...item, login: value.login!, role: value.role! }
          : item
      );
    } else {
      const nextId = Math.max(0, ...this.items.map((i) => i.id)) + 1;
      this.items = [
        ...this.items,
        { id: nextId, login: value.login!, role: value.role! }
      ];
    }
    this.startAdd();
  }

  roleLabel(role: string): string {
    return role === 'ADMIN' ? 'Administrator' : 'Pracownik';
  }
}
