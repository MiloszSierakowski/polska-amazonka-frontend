import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminUser } from '../../models/admin-user.model';
import { AdminUserService } from '../../services/admin-user.service';
import { ToastService } from '../../../../core/admin/toast.service';
import { parseApiError } from '../../../../core/admin/api-error.util';
import { AdminUserFilterPipe } from '../../pipes/admin-user-filter.pipe';
import { ModalNavigationService } from '../../../../core/services/modal-navigation.service';

function optionalEmailValidator(control: AbstractControl): ValidationErrors | null {
  const value = (control.value as string | null | undefined)?.trim();
  if (!value) {
    return null;
  }
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(value) ? null : { email: true };
}

type UserConfirmAction = 'delete' | 'block' | 'unblock' | 'resetPassword';

@Component({
  selector: 'app-admin-users-section',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, AdminUserFilterPipe],
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
  searchQuery = '';
  resetPasswordModalOpen = false;
  resetPasswordUserLogin = '';
  generatedPassword = '';
  confirmModalOpen = false;
  confirmAction: UserConfirmAction | null = null;
  confirmTarget: AdminUser | null = null;
  private userModalNavigationId: number | null = null;
  private confirmModalNavigationId: number | null = null;
  private resetPasswordModalNavigationId: number | null = null;

  userAddForm = this.fb.group({
    login: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [optionalEmailValidator]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    role: ['WORKER' as 'ADMIN' | 'WORKER', Validators.required]
  });

  constructor(
    private fb: FormBuilder,
    private adminUserService: AdminUserService,
    private toastService: ToastService,
    private modalNavigationService: ModalNavigationService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  openAddUserModal(): void {
    this.resetAddForm();
    this.isUserModalOpen = true;
    this.userModalNavigationId = this.modalNavigationService.open(() => this.closeUserModal(true));
  }

  closeUserModal(fromNavigation = false): void {
    if (!fromNavigation) {
      this.userModalNavigationId = this.modalNavigationService.close(this.userModalNavigationId);
    } else {
      this.userModalNavigationId = null;
    }
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
    this.openConfirmModal('delete', item);
  }

  toggleBlocked(item: AdminUser): void {
    this.openConfirmModal(item.isBlocked ? 'unblock' : 'block', item);
  }

  resetPassword(item: AdminUser): void {
    this.openConfirmModal('resetPassword', item);
  }

  confirmModalTitle(): string {
    switch (this.confirmAction) {
      case 'delete':
        return 'Usunąć użytkownika?';
      case 'block':
        return 'Zablokować konto?';
      case 'unblock':
        return 'Odblokować konto?';
      case 'resetPassword':
        return 'Zresetować hasło?';
      default:
        return 'Potwierdzenie';
    }
  }

  confirmModalMessage(): string {
    const login = this.confirmTarget?.login ?? 'użytkownika';
    switch (this.confirmAction) {
      case 'delete':
        return `Konto „${login}” zostanie zablokowane i nie będzie mogło się zalogować.`;
      case 'block':
        return `Użytkownik „${login}” nie będzie mógł zalogować się do panelu.`;
      case 'unblock':
        return `Użytkownik „${login}” odzyska dostęp do panelu.`;
      case 'resetPassword':
        return `Wygenerujemy nowe hasło tymczasowe dla użytkownika „${login}”.`;
      default:
        return '';
    }
  }

  confirmModalButtonLabel(): string {
    switch (this.confirmAction) {
      case 'delete':
        return 'Usuń';
      case 'block':
        return 'Zablokuj';
      case 'unblock':
        return 'Odblokuj';
      case 'resetPassword':
        return 'Resetuj hasło';
      default:
        return 'Potwierdź';
    }
  }

  cancelConfirmModal(fromNavigation = false): void {
    if (this.confirmTarget && this.isActionPending(this.confirmTarget.id)) {
      return;
    }
    if (!fromNavigation) {
      this.confirmModalNavigationId = this.modalNavigationService.close(this.confirmModalNavigationId);
    } else {
      this.confirmModalNavigationId = null;
    }
    this.confirmModalOpen = false;
    this.confirmAction = null;
    this.confirmTarget = null;
  }

  confirmUserAction(): void {
    const target = this.confirmTarget;
    if (!target || !this.confirmAction) {
      return;
    }
    if (this.confirmAction === 'delete') {
      this.performDeleteUser(target);
      return;
    }
    if (this.confirmAction === 'block' || this.confirmAction === 'unblock') {
      this.performToggleBlocked(target, this.confirmAction === 'block');
      return;
    }
    this.performResetPassword(target);
  }

  private openConfirmModal(action: UserConfirmAction, item: AdminUser): void {
    this.confirmAction = action;
    this.confirmTarget = item;
    this.confirmModalOpen = true;
    this.confirmModalNavigationId = this.modalNavigationService.open(() => this.cancelConfirmModal(true));
  }

  private performDeleteUser(item: AdminUser): void {
    this.actionUserId = item.id;
    this.adminUserService.delete(item.id).subscribe({
      next: () => {
        this.actionUserId = null;
        this.confirmModalNavigationId = this.modalNavigationService.close(this.confirmModalNavigationId);
        this.confirmModalOpen = false;
        this.confirmAction = null;
        this.confirmTarget = null;
        this.items = this.items.filter((user) => user.id !== item.id);
        this.toastService.success('Użytkownik został usunięty.');
      },
      error: (error: HttpErrorResponse) => {
        this.actionUserId = null;
        this.toastService.error(this.resolveAdminMutationError(error));
      }
    });
  }

  private performToggleBlocked(item: AdminUser, nextBlocked: boolean): void {
    this.actionUserId = item.id;
    this.adminUserService.setBlocked(item.id, { isBlocked: nextBlocked }).subscribe({
      next: (updated) => {
        this.actionUserId = null;
        this.confirmModalNavigationId = this.modalNavigationService.close(this.confirmModalNavigationId);
        this.confirmModalOpen = false;
        this.confirmAction = null;
        this.confirmTarget = null;
        this.items = this.items.map((user) => (user.id === updated.id ? updated : user));
        this.toastService.success(nextBlocked ? 'Użytkownik został zablokowany.' : 'Użytkownik został odblokowany.');
      },
      error: (error: HttpErrorResponse) => {
        this.actionUserId = null;
        this.toastService.error(this.resolveAdminMutationError(error));
      }
    });
  }

  private performResetPassword(item: AdminUser): void {
    this.actionUserId = item.id;
    this.adminUserService.resetPassword(item.id).subscribe({
      next: (response) => {
        this.actionUserId = null;
        this.confirmModalNavigationId = this.modalNavigationService.close(this.confirmModalNavigationId);
        this.confirmModalOpen = false;
        this.confirmAction = null;
        this.confirmTarget = null;
        this.resetPasswordUserLogin = item.login;
        this.generatedPassword = response.generatedPassword;
        this.resetPasswordModalOpen = true;
        this.resetPasswordModalNavigationId = this.modalNavigationService.open(() => this.closeResetPasswordModal(true));
      },
      error: (error: HttpErrorResponse) => {
        this.actionUserId = null;
        this.toastService.error(this.resolveAdminMutationError(error));
      }
    });
  }

  closeResetPasswordModal(fromNavigation = false): void {
    if (!fromNavigation) {
      this.resetPasswordModalNavigationId = this.modalNavigationService.close(this.resetPasswordModalNavigationId);
    } else {
      this.resetPasswordModalNavigationId = null;
    }
    this.resetPasswordModalOpen = false;
    this.resetPasswordUserLogin = '';
    this.generatedPassword = '';
  }

  copyGeneratedPassword(): void {
    if (!this.generatedPassword) {
      return;
    }
    navigator.clipboard.writeText(this.generatedPassword).then(
      () => this.toastService.success('Hasło zostało skopiowane.'),
      () => this.toastService.error('Nie udało się skopiować hasła.')
    );
  }

  isActionPending(userId: number): boolean {
    return this.actionUserId === userId;
  }

  roleLabel(role: string): string {
    return role === 'ADMIN' ? 'Administrator' : 'Pracownik';
  }

  private resolveAdminMutationError(error: HttpErrorResponse): string {
    if (error.status === 403) {
      return 'Nie możesz modyfikować konta innego administratora';
    }
    return parseApiError(error).message;
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
