import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  isSubmitting = false;
  errorMessage = '';

  form = this.fb.group({
    login: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.logout();
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSubmitting = true;
    this.errorMessage = '';
    const { login, password } = this.form.getRawValue();
    this.authService.login(login!, password!).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/admin/panel']);
      },
      error: () => {
        this.isSubmitting = false;
        this.errorMessage = 'Nieprawidłowy login lub hasło.';
      }
    });
  }
}
