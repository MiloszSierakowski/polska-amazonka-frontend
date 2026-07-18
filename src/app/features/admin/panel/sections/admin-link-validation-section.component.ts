import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import {
  LinkValidationRun,
  LinkValidationRunDetails,
  LinkValidationRunStatus,
  LinkValidationSource,
  LinkValidationStatus,
  LinkVerificationStatus
} from '../../models/link-validation.model';
import { LinkValidationService } from '../../services/link-validation.service';

@Component({
  selector: 'app-admin-link-validation-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-link-validation-section.component.html',
  styleUrl: './admin-link-validation-section.component.scss'
})
export class AdminLinkValidationSectionComponent implements OnInit, OnChanges {
  @Input() active = false;

  status: LinkValidationStatus | null = null;
  runs: LinkValidationRun[] = [];
  selectedDetails: LinkValidationRunDetails | null = null;
  selectedRunId: number | null = null;

  statusLoading = false;
  runsLoading = false;
  detailsLoading = false;
  statusError = false;
  runsError = false;
  detailsErrorMessage: string | null = null;

  private loaded = false;

  constructor(private linkValidationService: LinkValidationService) {}

  ngOnInit(): void {
    if (this.active) {
      this.refresh();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['active']?.currentValue === true && !this.loaded) {
      this.refresh();
    }
  }

  refresh(): void {
    if (this.statusLoading || this.runsLoading) {
      return;
    }
    this.loaded = true;
    this.loadStatus();
    this.loadRuns();
  }

  selectRun(run: LinkValidationRun): void {
    if (this.detailsLoading) {
      return;
    }
    this.selectedRunId = run.id;
    this.selectedDetails = null;
    this.detailsErrorMessage = null;
    this.detailsLoading = true;
    this.linkValidationService.getRun(run.id).subscribe({
      next: (details) => {
        this.detailsLoading = false;
        this.selectedDetails = details;
      },
      error: (error: HttpErrorResponse) => {
        this.detailsLoading = false;
        this.detailsErrorMessage = error.status === 404
          ? 'Nie znaleziono wybranej partii. Odśwież listę i spróbuj ponownie.'
          : 'Nie udało się pobrać szczegółów partii.';
      }
    });
  }

  sourceLabel(source: LinkValidationSource): string {
    return source === 'MANUAL' ? 'Ręczna' : 'Automatyczna';
  }

  runStatusLabel(status: LinkValidationRunStatus): string {
    switch (status) {
      case 'RUNNING': return 'W trakcie';
      case 'COMPLETED': return 'Zakończona';
      case 'COMPLETED_WITH_ERRORS': return 'Zakończona z błędami';
      case 'FAILED': return 'Nieudana';
    }
  }

  verificationStatusLabel(status: LinkVerificationStatus): string {
    switch (status) {
      case 'WORKING': return 'Działa';
      case 'BROKEN': return 'Zepsuty';
      case 'UNCERTAIN': return 'Niepewny';
      case 'BLOCKED': return 'Zablokowany przez sklep';
      case 'TECHNICAL_ERROR': return 'Błąd techniczny';
    }
  }

  formatDate(value: string | null | undefined): string {
    if (!value) {
      return '—';
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? '—'
      : new Intl.DateTimeFormat('pl-PL', {
          dateStyle: 'short',
          timeStyle: 'medium'
        }).format(date);
  }

  flagTransition(previous: boolean | null, current: boolean | null): string {
    return `${this.booleanLabel(previous)} → ${this.booleanLabel(current)}`;
  }

  private loadStatus(): void {
    this.statusLoading = true;
    this.statusError = false;
    this.linkValidationService.getStatus().subscribe({
      next: (status) => {
        this.statusLoading = false;
        this.status = status;
      },
      error: () => {
        this.statusLoading = false;
        this.statusError = true;
      }
    });
  }

  private loadRuns(): void {
    this.runsLoading = true;
    this.runsError = false;
    this.linkValidationService.getRuns(20).subscribe({
      next: (runs) => {
        this.runsLoading = false;
        this.runs = runs;
      },
      error: () => {
        this.runsLoading = false;
        this.runsError = true;
      }
    });
  }

  private booleanLabel(value: boolean | null): string {
    if (value == null) {
      return 'brak';
    }
    return value ? 'tak' : 'nie';
  }
}
