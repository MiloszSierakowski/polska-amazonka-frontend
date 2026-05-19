import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AdminUser } from '../models/admin-user.model';
import { AdminUserService } from '../services/admin-user.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss'
})
export class AdminUsersComponent implements OnInit {
  users: AdminUser[] = [];
  isLoading = true;
  loadError = '';

  constructor(
    private adminUserService: AdminUserService,
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.adminUserService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.isLoading = false;
      },
      error: () => {
        this.loadError = 'Nie udało się pobrać listy użytkowników.';
        this.isLoading = false;
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/admin/login']);
  }

  roleLabel(role: string): string {
    return role === 'ADMIN' ? 'Administrator' : 'Pracownik';
  }
}
