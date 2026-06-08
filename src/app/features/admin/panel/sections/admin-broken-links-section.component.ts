import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { BrokenLinkProduct } from '../../models/broken-link.model';
import { BrokenLinkService } from '../../services/broken-link.service';
import { VideoService } from '../../../public/services/video.service';
import { ToastService } from '../../../../core/admin/toast.service';
import { ProductPreview, ProductPreviewService } from '../../services/product-preview.service';
import { ProductImageUploadService } from '../../services/product-image-upload.service';

@Component({
  selector: 'app-admin-broken-links-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-broken-links-section.component.html',
  styleUrl: './admin-broken-links-section.component.scss'
})
export class AdminBrokenLinksSectionComponent implements OnInit {
  items: BrokenLinkProduct[] = [];
  isLoading = false;
  hasLoadError = false;
  editingKey: string | null = null;
  saveError = '';
  isSaving = false;
  editPreviewLoading = false;
  editPreview: ProductPreview | null = null;
  editSelectedFileName = '';

  productEditForm = this.fb.group({
    name: ['', Validators.required],
    imageUrl: [''],
    shopUrl: ['', Validators.required]
  });

  private previewTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private fb: FormBuilder,
    private brokenLinkService: BrokenLinkService,
    private videoService: VideoService,
    private toastService: ToastService,
    private productPreviewService: ProductPreviewService,
    private productImageUploadService: ProductImageUploadService
  ) {}

  ngOnInit(): void {
    this.loadBrokenLinks();
  }

  trackKey(item: BrokenLinkProduct): string {
    return `${item.videoId}-${item.productId}`;
  }

  trackByItem(_index: number, item: BrokenLinkProduct): string {
    return this.trackKey(item);
  }

  productImageSrc(imageUrl: string | null): string {
    return this.videoService.resolveProductImageUrl(imageUrl);
  }

  productPreviewImageSrc(imageUrl: string | null | undefined): string {
    return this.videoService.resolveProductImageUrl(imageUrl ?? null);
  }

  isEditing(item: BrokenLinkProduct): boolean {
    return this.editingKey === this.trackKey(item);
  }

  startEdit(item: BrokenLinkProduct): void {
    if (this.editingKey === this.trackKey(item)) {
      this.cancelEdit();
      return;
    }
    this.editingKey = this.trackKey(item);
    this.saveError = '';
    this.editPreview = null;
    this.editPreviewLoading = false;
    this.editSelectedFileName = '';
    this.productEditForm.reset({
      name: item.productName,
      imageUrl: item.imageUrl ?? '',
      shopUrl: item.shopUrl
    });
  }

  cancelEdit(): void {
    this.editingKey = null;
    this.saveError = '';
    this.editPreview = null;
    this.editPreviewLoading = false;
    this.editSelectedFileName = '';
    this.productEditForm.reset({
      name: '',
      imageUrl: '',
      shopUrl: ''
    });
  }

  onEditUrlInput(): void {
    const url = this.productEditForm.get('shopUrl')?.value ?? '';
    if (this.previewTimer) {
      clearTimeout(this.previewTimer);
    }
    if (!url.trim()) {
      this.editPreviewLoading = false;
      this.editPreview = null;
      return;
    }
    this.editPreviewLoading = true;
    this.previewTimer = setTimeout(() => {
      this.productPreviewService.preview(url.trim()).subscribe({
        next: (preview) => {
          this.editPreviewLoading = false;
          this.editPreview = preview;
          if (preview) {
            this.productEditForm.patchValue({
              name: preview.name,
              imageUrl: preview.imageUrl ?? ''
            });
          }
        },
        error: () => {
          this.editPreviewLoading = false;
          this.editPreview = null;
        }
      });
    }, 400);
  }

  onEditImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    this.productImageUploadService.upload(file).subscribe({
      next: (response) => {
        this.productEditForm.patchValue({ imageUrl: response.imageUrl });
        this.editSelectedFileName = file.name;
      },
      error: () => {
        this.toastService.warning('Nie udało się przesłać zdjęcia produktu.');
      }
    });
  }

  saveEdit(item: BrokenLinkProduct): void {
    if (this.productEditForm.invalid || this.isSaving) {
      this.productEditForm.markAllAsTouched();
      return;
    }
    const value = this.productEditForm.getRawValue();
    this.isSaving = true;
    this.saveError = '';
    this.videoService
      .updateProduct(item.videoId, item.productId, {
        name: value.name!.trim(),
        imageUrl: value.imageUrl?.trim() || undefined,
        productLink: {
          url: value.shopUrl!.trim(),
          type: 'product'
        }
      })
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.items = this.items.filter(
            (entry) => entry.videoId !== item.videoId || entry.productId !== item.productId
          );
          this.cancelEdit();
          this.toastService.success('Link został naprawiony.');
        },
        error: (error: HttpErrorResponse) => {
          this.isSaving = false;
          this.saveError = this.resolveErrorMessage(error);
        }
      });
  }

  private loadBrokenLinks(): void {
    this.isLoading = true;
    this.hasLoadError = false;
    this.brokenLinkService.getAll().subscribe({
      next: (items) => {
        this.isLoading = false;
        this.items = items;
      },
      error: () => {
        this.isLoading = false;
        this.hasLoadError = true;
        this.items = [];
      }
    });
  }

  private resolveErrorMessage(error: HttpErrorResponse): string {
    const body = error.error;
    if (typeof body === 'string' && body.trim()) {
      return body.trim();
    }
    if (body && typeof body.message === 'string' && body.message.trim()) {
      return body.message.trim();
    }
    return 'Błąd zapisu: Serwer docelowy nie odpowiada lub link jest martwy';
  }
}
