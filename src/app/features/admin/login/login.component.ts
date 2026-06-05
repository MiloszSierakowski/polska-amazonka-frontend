import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../../../core/admin/toast.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  isSubmitting = false;

  form = this.fb.group({
    login: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.authService.logout();
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      if (this.form.invalid) {
        this.toastService.warning('Wypełnij login i hasło.');
      }
      return;
    }
    this.isSubmitting = true;
    const { login, password } = this.form.getRawValue();
    this.authService.login(login!, password!).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.toastService.success('Zalogowano pomyślnie.');
        this.router.navigate(['/admin/panel']);
      },
      error: () => {
        this.isSubmitting = false;
      }
    });
  }
}
