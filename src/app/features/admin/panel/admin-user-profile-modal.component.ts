import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { UserProfileService } from '../services/user-profile.service';
import { UserProfile } from '../models/admin-user.model';

@Component({
  selector: 'app-admin-user-profile-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-user-profile-modal.component.html',
  styleUrl: './admin-user-profile-modal.component.scss'
})
export class AdminUserProfileModalComponent implements OnInit {
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<UserProfile>();

  isLoading = true;
  isSaving = false;
  loadError = '';
  saveError = '';
  private originalLogin = '';

  profileForm = this.fb.group({
    login: ['', [Validators.required, Validators.minLength(3)]],
    firstName: [''],
    lastName: [''],
    email: ['', Validators.email],
    currentPassword: [''],
    newPassword: ['', Validators.minLength(8)],
    confirmNewPassword: ['']
  });

  constructor(
    private fb: FormBuilder,
    private userProfileService: UserProfileService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  close(): void {
    this.closed.emit();
  }

  save(): void {
    if (this.profileForm.invalid || this.isSaving) {
      this.profileForm.markAllAsTouched();
      return;
    }
    const value = this.profileForm.getRawValue();
    const login = value.login?.trim() ?? '';
    const newPassword = value.newPassword?.trim() ?? '';
    const confirmNewPassword = value.confirmNewPassword?.trim() ?? '';
    const currentPassword = value.currentPassword?.trim() ?? '';
    const loginChanged = login !== this.originalLogin;
    const passwordChanging = newPassword.length > 0;

    if (loginChanged || passwordChanging) {
      if (!currentPassword) {
        this.saveError = 'Podaj aktualne hasło, aby zmienić login lub hasło.';
        return;
      }
    }

    if (passwordChanging) {
      if (newPassword.length < 8) {
        this.saveError = 'Nowe hasło musi mieć co najmniej 8 znaków.';
        return;
      }
      if (newPassword !== confirmNewPassword) {
        this.saveError = 'Nowe hasła nie są identyczne.';
        return;
      }
    }

    if (confirmNewPassword && !passwordChanging) {
      this.saveError = 'Wypełnij pole nowego hasła.';
      return;
    }

    this.isSaving = true;
    this.saveError = '';
    this.userProfileService
      .updateProfile({
        login,
        firstName: value.firstName?.trim() || null,
        lastName: value.lastName?.trim() || null,
        email: value.email?.trim() || null,
        currentPassword: currentPassword || null,
        newPassword: passwordChanging ? newPassword : null
      })
      .subscribe({
        next: (profile) => {
          this.isSaving = false;
          this.authService.updateProfileState(profile);
          this.saved.emit(profile);
          this.closed.emit();
        },
        error: (error: HttpErrorResponse) => {
          this.isSaving = false;
          this.saveError = this.resolveSaveError(error);
        }
      });
  }

  private loadProfile(): void {
    this.isLoading = true;
    this.loadError = '';
    this.userProfileService.getProfile().subscribe({
      next: (profile) => {
        this.isLoading = false;
        this.patchForm(profile);
      },
      error: () => {
        const snapshot = this.authService.getProfileSnapshot();
        if (snapshot) {
          this.isLoading = false;
          this.patchForm(snapshot);
          return;
        }
        this.isLoading = false;
        this.loadError = 'Nie udało się wczytać profilu.';
      }
    });
  }

  private patchForm(profile: UserProfile): void {
    this.originalLogin = profile.login;
    this.profileForm.reset({
      login: profile.login,
      firstName: profile.firstName ?? '',
      lastName: profile.lastName ?? '',
      email: profile.email ?? '',
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: ''
    });
  }

  private resolveSaveError(error: HttpErrorResponse): string {
    if (error.status === 401) {
      return 'Aktualne hasło jest nieprawidłowe.';
    }
    if (error.status === 409) {
      return 'Ten login jest już zajęty.';
    }
    if (error.status === 400) {
      return 'Sprawdź poprawność wprowadzonych danych.';
    }
    return 'Nie udało się zapisać profilu.';
  }
}
