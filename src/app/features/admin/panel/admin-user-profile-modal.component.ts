import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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

  profileForm = this.fb.group({
    login: [{ value: '', disabled: true }],
    firstName: [''],
    lastName: [''],
    email: ['', Validators.email]
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
    this.isSaving = true;
    this.saveError = '';
    const value = this.profileForm.getRawValue();
    this.userProfileService
      .updateProfile({
        firstName: value.firstName?.trim() || null,
        lastName: value.lastName?.trim() || null,
        email: value.email?.trim() || null
      })
      .subscribe({
        next: (profile) => {
          this.isSaving = false;
          this.authService.updateProfileState(profile);
          this.saved.emit(profile);
          this.closed.emit();
        },
        error: () => {
          this.isSaving = false;
          this.saveError = 'Nie udało się zapisać profilu.';
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
    this.profileForm.patchValue({
      login: profile.login,
      firstName: profile.firstName ?? '',
      lastName: profile.lastName ?? '',
      email: profile.email ?? ''
    });
  }
}
