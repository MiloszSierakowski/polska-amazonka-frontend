import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChangeLog } from '../../models/change-log.model';
import { ChangeLogService } from '../../services/changelog.service';

@Component({
  selector: 'app-admin-changelog-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-changelog-section.component.html',
  styleUrl: './admin-changelog-section.component.scss'
})
export class AdminChangelogSectionComponent implements OnInit {
  logs: ChangeLog[] = [];
  isLoading = false;
  hasLoadError = false;

  constructor(private changeLogService: ChangeLogService) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  formatDate(value: string): string {
    return new Date(value).toLocaleString('pl-PL');
  }

  private loadLogs(): void {
    this.isLoading = true;
    this.hasLoadError = false;
    this.changeLogService.getAll().subscribe({
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
}
