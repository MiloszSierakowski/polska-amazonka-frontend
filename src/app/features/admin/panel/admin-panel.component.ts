import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AdminVideosSectionComponent } from './sections/admin-videos-section.component';
import { AdminCategoriesSectionComponent } from './sections/admin-categories-section.component';
import { AdminShopsSectionComponent } from './sections/admin-shops-section.component';
import { AdminUsersSectionComponent } from './sections/admin-users-section.component';
import { AdminChangelogSectionComponent } from './sections/admin-changelog-section.component';
import { AdminAnalyticsSectionComponent } from './sections/admin-analytics-section.component';
import { AdminBrokenLinksSectionComponent } from './sections/admin-broken-links-section.component';
import { AdminNavigationLinksSectionComponent } from './sections/admin-navigation-links-section.component';
import { AdminLinkValidationSectionComponent } from './sections/admin-link-validation-section.component';
import { AdminUserProfileModalComponent } from './admin-user-profile-modal.component';
import { UserProfile } from '../models/admin-user.model';

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
    AdminShopsSectionComponent,
    AdminUsersSectionComponent,
    AdminChangelogSectionComponent,
    AdminAnalyticsSectionComponent,
    AdminBrokenLinksSectionComponent,
    AdminLinkValidationSectionComponent,
    AdminNavigationLinksSectionComponent,
    AdminUserProfileModalComponent
  ],
  templateUrl: './admin-panel.component.html',
  styleUrl: './admin-panel.component.scss'
})
export class AdminPanelComponent {
  openSectionIds: string[] = [];
  profileModalOpen = false;
  sessionLabel = '';

  readonly sections: AccordionSection[] = [
    { id: 'videos', title: 'Filmy', adminOnly: false },
    { id: 'promoted-videos', title: 'Promowane filmy', adminOnly: false },
    { id: 'categories', title: 'Kategorie', adminOnly: false },
    { id: 'shops', title: 'Sklepy', adminOnly: false },
    { id: 'analytics', title: 'Statystyki', adminOnly: false },
    { id: 'broken-links', title: 'Linki wymagające sprawdzenia', adminOnly: false },
    { id: 'link-validation', title: 'Weryfikacja linków', adminOnly: false },
    { id: 'navigation-links', title: 'Linki', adminOnly: false },
    { id: 'users', title: 'Użytkownicy', adminOnly: true },
    { id: 'changelog', title: 'Historia zmian', adminOnly: true }
  ];

  constructor(
    public authService: AuthService,
    private router: Router
  ) {
    this.refreshSessionLabel();
  }

  visibleSections(): AccordionSection[] {
    return this.sections.filter(
      (section) => !section.adminOnly || this.authService.isAdmin()
    );
  }

  toggleSection(sectionId: string): void {
    if (this.isOpen(sectionId)) {
      this.openSectionIds = this.openSectionIds.filter((id) => id !== sectionId);
      return;
    }
    this.openSectionIds = [...this.openSectionIds, sectionId];
  }

  isOpen(sectionId: string): boolean {
    return this.openSectionIds.includes(sectionId);
  }

  openProfileModal(): void {
    this.profileModalOpen = true;
  }

  closeProfileModal(): void {
    this.profileModalOpen = false;
  }

  onProfileSaved(profile: UserProfile): void {
    this.authService.updateProfileState(profile);
    this.refreshSessionLabel();
    this.profileModalOpen = false;
  }

  logout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/admin/login']);
    });
  }

  private refreshSessionLabel(): void {
    const login = this.authService.getLogin();
    if (!login) {
      this.sessionLabel = '';
      return;
    }
    const firstName = this.authService.getFirstName()?.trim();
    const lastName = this.authService.getLastName()?.trim();
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
    this.sessionLabel = fullName ? `${fullName} (${login})` : login;
  }
}
