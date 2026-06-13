import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChangeLog } from '../../models/change-log.model';
import { ChangeLogService } from '../../services/changelog.service';
import { AdminUser } from '../../models/admin-user.model';
import { AdminUserService } from '../../services/admin-user.service';

@Component({
  selector: 'app-admin-changelog-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-changelog-section.component.html',
  styleUrl: './admin-changelog-section.component.scss'
})
export class AdminChangelogSectionComponent implements OnInit {
  logs: ChangeLog[] = [];
  users: AdminUser[] = [];
  isLoading = false;
  isLoadingUsers = false;
  hasLoadError = false;
  selectedUserLabel = '';
  dateFrom = '';
  dateTo = '';
  isDateMenuOpen = false;
  isCustomRangeOpen = false;
  activeDatePreset: 'today' | 'yesterday' | 'last7' | 'currentMonth' | 'custom' | null = null;

  constructor(
    private changeLogService: ChangeLogService,
    private adminUserService: AdminUserService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadLogs();
  }

  formatDate(value: string): string {
    return new Date(value).toLocaleString('pl-PL');
  }

  applyFilters(): void {
    this.loadLogs();
  }

  toggleDateMenu(): void {
    this.isDateMenuOpen = !this.isDateMenuOpen;
  }

  applyToday(): void {
    const today = new Date();
    this.dateFrom = this.toDateInputValue(today);
    this.dateTo = this.toDateInputValue(today);
    this.activeDatePreset = 'today';
    this.isCustomRangeOpen = false;
    this.loadLogs();
  }

  applyYesterday(): void {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    this.dateFrom = this.toDateInputValue(yesterday);
    this.dateTo = this.toDateInputValue(yesterday);
    this.activeDatePreset = 'yesterday';
    this.isCustomRangeOpen = false;
    this.loadLogs();
  }

  applyLastSevenDays(): void {
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - 6);
    this.dateFrom = this.toDateInputValue(start);
    this.dateTo = this.toDateInputValue(today);
    this.activeDatePreset = 'last7';
    this.isCustomRangeOpen = false;
    this.loadLogs();
  }

  applyCurrentMonth(): void {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    this.dateFrom = this.toDateInputValue(start);
    this.dateTo = this.toDateInputValue(today);
    this.activeDatePreset = 'currentMonth';
    this.isCustomRangeOpen = false;
    this.loadLogs();
  }

  openCustomRange(): void {
    this.activeDatePreset = 'custom';
    this.isCustomRangeOpen = true;
  }

  applyCustomRange(): void {
    this.activeDatePreset = 'custom';
    this.loadLogs();
  }

  clearFilters(): void {
    this.selectedUserLabel = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.activeDatePreset = null;
    this.isDateMenuOpen = false;
    this.isCustomRangeOpen = false;
    this.loadLogs();
  }

  dateRangeLabel(): string {
    switch (this.activeDatePreset) {
      case 'today':
        return 'Dzisiaj';
      case 'yesterday':
        return 'Wczoraj';
      case 'last7':
        return 'Ostatnie 7 dni';
      case 'currentMonth':
        return 'Bieżący miesiąc';
      case 'custom':
        return this.dateFrom || this.dateTo ? 'Zakres dat' : 'Wybierz zakres dat';
      default:
        return 'Wybierz zakres dat';
    }
  }

  private loadUsers(): void {
    this.isLoadingUsers = true;
    this.adminUserService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.isLoadingUsers = false;
      },
      error: () => {
        this.users = [];
        this.isLoadingUsers = false;
      }
    });
  }

  private loadLogs(): void {
    this.isLoading = true;
    this.hasLoadError = false;
    this.changeLogService.getAll({
      userId: this.resolveSelectedUserId(),
      startDate: this.resolveStartDate(),
      endDate: this.resolveEndDate()
    }).subscribe({
      next: (logs) => {
        this.logs = logs;
        this.isLoading = false;
      },
      error: () => {
        this.hasLoadError = true;
        this.isLoading = false;
      }
    });
  }

  private resolveSelectedUserId(): number | null {
    const label = this.selectedUserLabel.trim().toLowerCase();
    if (!label) {
      return null;
    }
    const selected = this.users.find((user) => this.userOptionLabel(user).toLowerCase() === label);
    return selected?.id ?? null;
  }

  private resolveStartDate(): Date | null {
    if (!this.dateFrom) {
      return null;
    }
    return new Date(`${this.dateFrom}T00:00:00`);
  }

  private resolveEndDate(): Date | null {
    if (!this.dateTo) {
      return null;
    }
    return new Date(`${this.dateTo}T23:59:59`);
  }

  private toDateInputValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  userOptionLabel(user: AdminUser): string {
    return `${user.login} (ID: ${user.id})`;
  }
}
