import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MOCK_CHANGE_LOGS } from '../../mocks/admin-mock.data';
import { ChangeLog } from '../../models/change-log.model';

@Component({
  selector: 'app-admin-changelog-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-changelog-section.component.html',
  styleUrl: './admin-changelog-section.component.scss'
})
export class AdminChangelogSectionComponent {
  logs: ChangeLog[] = [...MOCK_CHANGE_LOGS];

  formatDate(value: string): string {
    return new Date(value).toLocaleString('pl-PL');
  }
}
