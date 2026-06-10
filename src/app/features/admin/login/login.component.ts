import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../../../core/admin/toast.service';
import { parseApiError } from '../../../core/admin/api-error.util';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  isSubmitting = false;
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {
    this.form = this.fb.group({
      login: ['', [Validators.required, Validators.minLength(1)]],
      password: ['', [Validators.required, Validators.minLength(1)]]
    });
  }

  ngOnInit(): void {
    this.authService.clearLocalSession();
  }

  submit(): void {
    const login = this.form.controls['login'].value?.trim() ?? '';
    const password = this.form.controls['password'].value ?? '';

    this.form.patchValue({ login, password }, { emitEvent: false });

    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      if (this.form.invalid) {
        this.toastService.warning('Wypełnij login i hasło.');
      }
      return;
    }

    this.isSubmitting = true;
    this.authService
      .login(login, password)
      .pipe(finalize(() => {
        this.isSubmitting = false;
      }))
      .subscribe({
        next: () => {
          this.toastService.success('Zalogowano pomyślnie.');
          this.router.navigate(['/admin/panel']);
        },
        error: (error) => {
          this.toastService.error(parseApiError(error).message);
        }
      });
  }
}
