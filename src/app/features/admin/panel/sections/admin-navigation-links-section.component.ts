import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { LinkDTO, LinkService, SaveLinkPayload } from '../../../../core/services/link.service';
import { AdminLinkService } from '../../services/admin-link.service';
import { ToastService } from '../../../../core/admin/toast.service';
import { parseApiError } from '../../../../core/admin/api-error.util';

@Component({
  selector: 'app-admin-navigation-links-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DragDropModule],
  templateUrl: './admin-navigation-links-section.component.html',
  styleUrl: './admin-navigation-links-section.component.scss'
})
export class AdminNavigationLinksSectionComponent implements OnInit {
  items: LinkDTO[] = [];
  isLoading = false;
  hasLoadError = false;
  isSaving = false;
  isModalOpen = false;
  deleteModalOpen = false;
  deleteTargetId: number | null = null;
  isDeleting = false;
  editingLinkId: number | null = null;
  formSubmitted = false;
  saveError = '';
  selectedImageFile: File | null = null;
  selectedImageFileName = '';
  selectedImagePreviewUrl: string | null = null;
  currentImagePath: string | null = null;
  activeToggleId: number | null = null;
  isSavingOrder = false;

  linkForm = this.fb.group({
    url: ['', Validators.required],
    isActive: [true]
  });

  constructor(
    private fb: FormBuilder,
    private adminLinkService: AdminLinkService,
    private linkService: LinkService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadLinks();
  }

  openAddModal(): void {
    this.editingLinkId = null;
    this.resetForm();
    this.isModalOpen = true;
  }

  openEditModal(item: LinkDTO): void {
    this.editingLinkId = item.id;
    this.saveError = '';
    this.formSubmitted = false;
    this.linkForm.reset({
      url: item.url,
      isActive: item.isActive ?? true
    });
    this.selectedImageFile = null;
    this.selectedImageFileName = '';
    this.revokeSelectedImagePreview();
    this.currentImagePath = item.imagePath ?? null;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.editingLinkId = null;
    this.resetForm();
  }

  saveLink(): void {
    this.saveError = '';
    this.formSubmitted = true;
    if (this.linkForm.invalid) {
      this.linkForm.markAllAsTouched();
      return;
    }
    const payload = this.buildPayload();
    if (!payload) {
      return;
    }
    this.isSaving = true;
    const request$ = this.editingLinkId == null
      ? this.adminLinkService.create(payload, this.selectedImageFile)
      : this.adminLinkService.update(this.editingLinkId, payload, this.selectedImageFile);

    request$.subscribe({
      next: () => {
        this.isSaving = false;
        this.toastService.success(
          this.editingLinkId == null ? 'Link został dodany.' : 'Link został zaktualizowany.'
        );
        this.closeModal();
        this.loadLinks();
      },
      error: (error: HttpErrorResponse) => {
        this.isSaving = false;
        this.saveError = parseApiError(error).message;
      }
    });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.revokeSelectedImagePreview();
    this.selectedImageFile = file;
    this.selectedImageFileName = file?.name ?? '';
    this.selectedImagePreviewUrl = file ? URL.createObjectURL(file) : null;
  }

  toggleActive(item: LinkDTO, event: Event): void {
    const input = event.target as HTMLInputElement;
    const nextActive = input.checked;
    const previousActive = item.isActive;
    item.isActive = nextActive;
    this.activeToggleId = item.id;
    this.adminLinkService.update(
      item.id,
      {
        url: item.url,
        type: 'social',
        isActive: nextActive
      },
      null
    ).subscribe({
      next: (updated) => {
        this.activeToggleId = null;
        this.items = this.items.map((link) => (link.id === updated.id ? updated : link));
        this.toastService.success(nextActive ? 'Link został aktywowany.' : 'Link został wyłączony.');
      },
      error: (error: HttpErrorResponse) => {
        this.activeToggleId = null;
        item.isActive = previousActive;
        this.toastService.error(parseApiError(error).message);
      }
    });
  }

  drop(event: CdkDragDrop<LinkDTO[]>): void {
    if (event.previousIndex === event.currentIndex || this.isSavingOrder) {
      return;
    }
    moveItemInArray(this.items, event.previousIndex, event.currentIndex);
    this.isSavingOrder = true;
    this.adminLinkService.reorder(this.items.map((item) => item.id)).subscribe({
      next: () => {
        this.isSavingOrder = false;
        this.toastService.success('Kolejność linków została zapisana.');
      },
      error: (error: HttpErrorResponse) => {
        this.isSavingOrder = false;
        this.toastService.error(parseApiError(error).message);
        this.loadLinks();
      }
    });
  }

  openDeleteModal(item: LinkDTO): void {
    this.deleteTargetId = item.id;
    this.deleteModalOpen = true;
  }

  cancelDelete(): void {
    if (this.isDeleting) {
      return;
    }
    this.deleteModalOpen = false;
    this.deleteTargetId = null;
  }

  confirmDelete(): void {
    if (this.deleteTargetId == null || this.isDeleting) {
      return;
    }
    this.isDeleting = true;
    const targetId = this.deleteTargetId;
    this.adminLinkService.delete(targetId).subscribe({
      next: () => {
        this.isDeleting = false;
        this.deleteModalOpen = false;
        this.deleteTargetId = null;
        this.loadLinks();
        this.toastService.success('Link został usunięty.');
      },
      error: (error: HttpErrorResponse) => {
        this.isDeleting = false;
        this.toastService.error(parseApiError(error).message);
      }
    });
  }

  showFieldError(fieldName: string): boolean {
    const control = this.linkForm.get(fieldName);
    return !!(control && control.invalid && (control.touched || this.formSubmitted));
  }

  fieldErrorMessage(fieldName: string): string {
    const control = this.linkForm.get(fieldName);
    if (!control?.errors) {
      return '';
    }
    if (control.errors['required'] && fieldName === 'url') {
      return 'Adres URL jest wymagany.';
    }
    return 'Wartość w tym polu jest nieprawidłowa.';
  }

  modalTitle(): string {
    return this.editingLinkId == null ? 'Dodaj link social' : 'Edytuj link social';
  }

  platformLabel(url: string): string {
    const lower = url.toLowerCase();
    if (lower.includes('tiktok')) return 'TikTok';
    if (lower.includes('instagram')) return 'Instagram';
    if (lower.includes('facebook')) return 'Facebook';
    if (lower.includes('youtube')) return 'YouTube';
    return 'Social';
  }

  resolveIconPreview(item: LinkDTO): string {
    return this.linkService.resolveIconUrl(item);
  }

  hasUploadedIcon(item: LinkDTO): boolean {
    return !!item.imagePath?.trim();
  }

  modalImagePreview(): string | null {
    if (this.selectedImagePreviewUrl) {
      return this.selectedImagePreviewUrl;
    }
    if (this.currentImagePath) {
      return this.linkService.resolveImageUrl(this.currentImagePath);
    }
    const url = this.linkForm.value.url?.trim();
    return url ? this.linkService.defaultIconUrl(url) : this.linkService.defaultIconUrl('');
  }

  modalUsesDefaultIcon(): boolean {
    return !this.selectedImagePreviewUrl && !this.currentImagePath;
  }

  private buildPayload(): SaveLinkPayload | null {
    if (this.linkForm.invalid) {
      return null;
    }
    const value = this.linkForm.getRawValue();
    return {
      url: value.url!.trim(),
      type: 'social',
      isActive: value.isActive ?? true
    };
  }

  private resetForm(): void {
    this.saveError = '';
    this.formSubmitted = false;
    this.revokeSelectedImagePreview();
    this.selectedImageFile = null;
    this.selectedImageFileName = '';
    this.currentImagePath = null;
    this.linkForm.reset({
      url: '',
      isActive: true
    });
  }

  private loadLinks(): void {
    this.isLoading = true;
    this.hasLoadError = false;
    this.adminLinkService.getSocialLinks().subscribe({
      next: (links) => {
        this.isLoading = false;
        this.items = links;
      },
      error: () => {
        this.isLoading = false;
        this.hasLoadError = true;
      }
    });
  }

  private revokeSelectedImagePreview(): void {
    if (this.selectedImagePreviewUrl) {
      URL.revokeObjectURL(this.selectedImagePreviewUrl);
      this.selectedImagePreviewUrl = null;
    }
  }
}
