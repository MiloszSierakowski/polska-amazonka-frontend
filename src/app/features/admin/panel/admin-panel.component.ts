import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AdminVideosSectionComponent } from './sections/admin-videos-section.component';
import { AdminCategoriesSectionComponent } from './sections/admin-categories-section.component';
import { AdminDiscountsSectionComponent } from './sections/admin-discounts-section.component';
import { AdminUsersSectionComponent } from './sections/admin-users-section.component';
import { AdminChangelogSectionComponent } from './sections/admin-changelog-section.component';

interface AccordionSection {
  id: string;
  title: string;
  adminOnly: boolean;
}

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [
    CommonModule,
    AdminVideosSectionComponent,
    AdminCategoriesSectionComponent,
    AdminDiscountsSectionComponent,
    AdminUsersSectionComponent,
    AdminChangelogSectionComponent
  ],
  templateUrl: './admin-panel.component.html',
  styleUrl: './admin-panel.component.scss'
})
export class AdminPanelComponent {
  activeSectionId: string | null = null;

  readonly sections: AccordionSection[] = [
    { id: 'videos', title: 'Filmy', adminOnly: false },
    { id: 'categories', title: 'Kategorie', adminOnly: false },
    { id: 'discounts', title: 'Kody rabatowe', adminOnly: false },
    { id: 'users', title: 'Użytkownicy', adminOnly: true },
    { id: 'changelog', title: 'Historia zmian', adminOnly: false }
  ];

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  visibleSections(): AccordionSection[] {
    return this.sections.filter(
      (section) => !section.adminOnly || this.authService.isAdmin()
    );
  }

  toggleSection(sectionId: string): void {
    this.activeSectionId = this.activeSectionId === sectionId ? null : sectionId;
  }

  isOpen(sectionId: string): boolean {
    return this.activeSectionId === sectionId;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/admin/login']);
  }
}
