import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminUser } from '../../models/admin-user.model';
import { AdminUserService } from '../../services/admin-user.service';
import { ToastService } from '../../../../core/admin/toast.service';
import { parseApiError } from '../../../../core/admin/api-error.util';

function optionalEmailValidator(control: AbstractControl): ValidationErrors | null {
  const value = (control.value as string | null | undefined)?.trim();
  if (!value) {
    return null;
  }
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(value) ? null : { email: true };
}

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
  formSubmitted = false;
  actionUserId: number | null = null;
  saveError = '';

  userAddForm = this.fb.group({
    login: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [optionalEmailValidator]],
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
    this.resetAddForm();
    this.isUserModalOpen = true;
  }

  closeUserModal(): void {
    this.isUserModalOpen = false;
    this.resetAddForm();
  }

  saveNewUser(): void {
    this.saveError = '';
    this.formSubmitted = true;
    if (this.userAddForm.invalid) {
      this.userAddForm.markAllAsTouched();
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
          this.saveError = parseApiError(error).message;
        }
      });
  }

  showFieldError(fieldName: string): boolean {
    const control = this.userAddForm.get(fieldName);
    return !!(control && control.invalid && (control.touched || this.formSubmitted));
  }

  fieldErrorMessage(fieldName: string): string {
    const control = this.userAddForm.get(fieldName);
    if (!control?.errors) {
      return '';
    }
    if (control.errors['required']) {
      if (fieldName === 'login') {
        return 'Login jest wymagany.';
      }
      if (fieldName === 'password') {
        return 'Hasło jest wymagane.';
      }
      return 'To pole jest wymagane.';
    }
    if (control.errors['minlength']) {
      if (fieldName === 'login') {
        return 'Login musi mieć co najmniej 3 znaki.';
      }
      if (fieldName === 'password') {
        return 'Hasło musi mieć co najmniej 8 znaków.';
      }
    }
    if (control.errors['email']) {
      return 'Podany adres e-mail jest nieprawidłowy.';
    }
    return 'Wartość w tym polu jest nieprawidłowa.';
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
        this.toastService.error(parseApiError(error).message);
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
        this.toastService.error(parseApiError(error).message);
      }
    });
  }

  isActionPending(userId: number): boolean {
    return this.actionUserId === userId;
  }

  roleLabel(role: string): string {
    return role === 'ADMIN' ? 'Administrator' : 'Pracownik';
  }

  private resetAddForm(): void {
    this.saveError = '';
    this.formSubmitted = false;
    this.userAddForm.reset({ login: '', email: '', password: '', role: 'WORKER' });
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
}
