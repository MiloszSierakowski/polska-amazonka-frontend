import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminUser } from '../../models/admin-user.model';
import { AdminUserService } from '../../services/admin-user.service';
import { ToastService } from '../../../../core/admin/toast.service';

@Component({
  selector: 'app-admin-users-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-users-section.component.html',
  styleUrl: './admin-users-section.component.scss'
})
export class AdminUsersSectionComponent implements OnInit {
  items: AdminUser[] = [];
  isLoading = false;
  hasLoadError = false;
  isSaving = false;
  isUserModalOpen = false;
  actionUserId: number | null = null;

  userAddForm = this.fb.group({
    login: ['', Validators.required],
    email: [''],
    password: ['', [Validators.required, Validators.minLength(8)]],
    role: ['WORKER' as 'ADMIN' | 'WORKER', Validators.required]
  });

  constructor(
    private fb: FormBuilder,
    private adminUserService: AdminUserService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  openAddUserModal(): void {
    this.userAddForm.reset({ login: '', email: '', password: '', role: 'WORKER' });
    this.isUserModalOpen = true;
  }

  closeUserModal(): void {
    this.isUserModalOpen = false;
    this.userAddForm.reset({ login: '', email: '', password: '', role: 'WORKER' });
  }

  saveNewUser(): void {
    if (this.userAddForm.invalid) {
      this.userAddForm.markAllAsTouched();
      this.toastService.warning('Uzupełnij wymagane pola użytkownika.');
      return;
    }
    const value = this.userAddForm.getRawValue();
    const email = value.email?.trim();
    this.isSaving = true;
    this.adminUserService
      .create({
        login: value.login!.trim(),
        password: value.password!,
        role: value.role!,
        email: email ? email : null
      })
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.toastService.success('Użytkownik został dodany.');
          this.closeUserModal();
          this.loadUsers();
        },
        error: (error: HttpErrorResponse) => {
          this.isSaving = false;
          this.toastService.error(this.resolveErrorMessage(error, 'Nie udało się dodać użytkownika.'));
        }
      });
  }

  deleteUser(item: AdminUser): void {
    if (!confirm(`Czy na pewno usunąć użytkownika „${item.login}”?`)) {
      return;
    }
    this.actionUserId = item.id;
    this.adminUserService.delete(item.id).subscribe({
      next: () => {
        this.actionUserId = null;
        this.items = this.items.filter((user) => user.id !== item.id);
        this.toastService.success('Użytkownik został usunięty.');
      },
      error: (error: HttpErrorResponse) => {
        this.actionUserId = null;
        this.toastService.error(this.resolveErrorMessage(error, 'Nie udało się usunąć użytkownika.'));
      }
    });
  }

  toggleBlocked(item: AdminUser): void {
    const nextBlocked = !item.isBlocked;
    const actionLabel = nextBlocked ? 'zablokować' : 'odblokować';
    if (!confirm(`Czy na pewno ${actionLabel} użytkownika „${item.login}”?`)) {
      return;
    }
    this.actionUserId = item.id;
    this.adminUserService.setBlocked(item.id, { isBlocked: nextBlocked }).subscribe({
      next: (updated) => {
        this.actionUserId = null;
        this.items = this.items.map((user) => (user.id === updated.id ? updated : user));
        this.toastService.success(nextBlocked ? 'Użytkownik został zablokowany.' : 'Użytkownik został odblokowany.');
      },
      error: (error: HttpErrorResponse) => {
        this.actionUserId = null;
        this.toastService.error(this.resolveErrorMessage(error, 'Nie udało się zmienić statusu użytkownika.'));
      }
    });
  }

  isActionPending(userId: number): boolean {
    return this.actionUserId === userId;
  }

  roleLabel(role: string): string {
    return role === 'ADMIN' ? 'Administrator' : 'Pracownik';
  }

  private loadUsers(): void {
    this.isLoading = true;
    this.hasLoadError = false;
    this.adminUserService.getUsers().subscribe({
      next: (users) => {
        this.items = users;
        this.isLoading = false;
      },
      error: () => {
        this.hasLoadError = true;
        this.isLoading = false;
      }
    });
  }

  private resolveErrorMessage(error: HttpErrorResponse, fallback: string): string {
    if (typeof error.error === 'string' && error.error.trim()) {
      return error.error;
    }
    if (error.error?.message) {
      return error.error.message;
    }
    return fallback;
  }
}
