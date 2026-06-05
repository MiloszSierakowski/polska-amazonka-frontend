import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminVideoMock, AdminVideoProductMock } from '../../mocks/admin-mock.data';
import { VideoService } from '../../../public/services/video.service';
import { Video } from '../../../public/models/video.model';
import { CategoryService } from '../../../../services/category.service';
import { Category } from '../../../public/models/category.model';
import { ToastService } from '../../../../core/admin/toast.service';
import { ProductPreview, ProductPreviewService } from '../../services/product-preview.service';
import { ProductImageUploadService } from '../../services/product-image-upload.service';

@Component({
  selector: 'app-admin-videos-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-videos-section.component.html',
  styleUrl: './admin-videos-section.component.scss'
})
export class AdminVideosSectionComponent implements OnInit {
  videos: AdminVideoMock[] = [];
  categories: Category[] = [];
  openedVideoId: number | null = null;
  editingProductId: number | null = null;
  showExistingProductForm = false;
  showNewProductForm = false;
  addProductPreviewLoading = false;
  editProductPreviewLoading = false;
  addProductPreview: ProductPreview | null = null;
  editProductPreview: ProductPreview | null = null;
  newProductPreviewLoading: Record<number, boolean> = {};
  newProductPreview: Record<number, ProductPreview | null> = {};

  private readonly previewTimers = new Map<string, ReturnType<typeof setTimeout>>();

  videoForm = this.fb.group({
    title: ['', Validators.required],
    tiktokUrl: ['', Validators.required],
    isActive: [true]
  });

  productAddForm = this.fb.group({
    shopUrl: ['', Validators.required],
    name: [''],
    imageUrl: ['']
  });

  productEditForm = this.fb.group({
    name: ['', Validators.required],
    imageUrl: [''],
    shopUrl: ['', Validators.required]
  });

  newVideoForm = this.fb.group({
    title: ['', Validators.required],
    tiktokUrl: ['', Validators.required],
    isActive: [true],
    categoryIds: this.fb.array<number>([]),
    products: this.fb.array<FormGroup>([])
  });

  constructor(
    private fb: FormBuilder,
    private videoService: VideoService,
    private categoryService: CategoryService,
    private toastService: ToastService,
    private productPreviewService: ProductPreviewService,
    private productImageUploadService: ProductImageUploadService
  ) {}

  ngOnInit(): void {
    this.loadVideos();
    this.categoryService.getCategories().subscribe((categories) => {
      this.categories = categories;
    });
  }

  get newVideoCategoryIds(): FormArray {
    return this.newVideoForm.get('categoryIds') as FormArray;
  }

  get newVideoProducts(): FormArray<FormGroup> {
    return this.newVideoForm.get('products') as FormArray<FormGroup>;
  }

  previewImageSrc(video: AdminVideoMock): string {
    return this.videoService.resolvePreviewImageUrl(video.previewImageUrl);
  }

  productPreviewImageSrc(imageUrl: string | null | undefined): string {
    return this.videoService.resolveProductImageUrl(imageUrl);
  }

  toggleVideo(video: AdminVideoMock): void {
    if (this.openedVideoId === video.id) {
      this.openedVideoId = null;
      this.cancelProductForm();
      return;
    }
    this.openedVideoId = video.id;
    this.cancelProductForm();
    this.videoForm.reset({
      title: video.title,
      tiktokUrl: video.tiktokUrl,
      isActive: video.isActive
    });
  }

  isVideoOpen(video: AdminVideoMock): boolean {
    return this.openedVideoId === video.id;
  }

  saveVideo(video: AdminVideoMock): void {
    if (this.videoForm.invalid) {
      this.videoForm.markAllAsTouched();
      return;
    }
    const value = this.videoForm.getRawValue();
    video.title = value.title!;
    video.tiktokUrl = value.tiktokUrl!;
    video.isActive = value.isActive ?? true;
  }

  deleteVideo(video: AdminVideoMock): void {
    const confirmed = window.confirm(
      'Czy na pewno usunąć ten film? Produkty używane tylko w tym filmie zostaną trwale usunięte.'
    );
    if (!confirmed) {
      return;
    }
    this.videoService.delete(video.id).subscribe(() => {
      this.toastService.success('Film został usunięty.');
      if (this.openedVideoId === video.id) {
        this.openedVideoId = null;
        this.cancelProductForm();
      }
      this.loadVideos();
    });
  }

  toggleVideoCategory(video: AdminVideoMock, categoryId: number): void {
    video.categoryIds = video.categoryIds.includes(categoryId)
      ? video.categoryIds.filter((id) => id !== categoryId)
      : [...video.categoryIds, categoryId];
  }

  startEditProduct(product: AdminVideoProductMock): void {
    this.editingProductId = product.id;
    this.showExistingProductForm = true;
    this.showNewProductForm = false;
    this.editProductPreview = null;
    this.editProductPreviewLoading = false;
    this.productEditForm.reset({
      name: product.name,
      imageUrl: product.imageUrl,
      shopUrl: product.shopUrl
    });
  }

  startAddProduct(): void {
    this.editingProductId = null;
    this.showExistingProductForm = true;
    this.showNewProductForm = false;
    this.addProductPreview = null;
    this.addProductPreviewLoading = false;
    this.productAddForm.reset({ shopUrl: '', name: '', imageUrl: '' });
  }

  cancelProductForm(): void {
    this.editingProductId = null;
    this.showExistingProductForm = false;
    this.showNewProductForm = false;
    this.addProductPreview = null;
    this.editProductPreview = null;
    this.addProductPreviewLoading = false;
    this.editProductPreviewLoading = false;
    this.productAddForm.reset({ shopUrl: '', name: '', imageUrl: '' });
    this.productEditForm.reset({ name: '', imageUrl: '', shopUrl: '' });
  }

  onAddProductUrlInput(): void {
    const url = this.productAddForm.get('shopUrl')?.value ?? '';
    this.scheduleProductPreview('add', url, (preview, loading) => {
      this.addProductPreviewLoading = loading;
      if (loading) {
        return;
      }
      this.addProductPreview = preview;
      if (preview) {
        this.productAddForm.patchValue({
          name: preview.name,
          imageUrl: preview.imageUrl ?? ''
        });
        if (preview.requiresManualImage) {
          this.toastService.warning(this.manualImageWarning(preview.platform));
        }
      }
    });
  }

  onAddProductImageSelected(event: Event): void {
    this.handleProductImageUpload(event, (imageUrl) => {
      this.productAddForm.patchValue({ imageUrl });
    });
  }

  onEditProductImageSelected(event: Event): void {
    this.handleProductImageUpload(event, (imageUrl) => {
      this.productEditForm.patchValue({ imageUrl });
    });
  }

  onNewProductImageSelected(index: number, event: Event): void {
    this.handleProductImageUpload(event, (imageUrl) => {
      this.newVideoProducts.at(index).patchValue({ imageUrl });
    });
  }

  onEditProductUrlInput(): void {
    const url = this.productEditForm.get('shopUrl')?.value ?? '';
    this.scheduleProductPreview('edit', url, (preview, loading) => {
      this.editProductPreviewLoading = loading;
      if (loading) {
        return;
      }
      this.editProductPreview = preview;
      if (preview) {
        this.productEditForm.patchValue({
          name: preview.name,
          imageUrl: preview.imageUrl ?? ''
        });
        if (preview.requiresManualImage) {
          this.toastService.warning(this.manualImageWarning(preview.platform));
        }
      }
    });
  }

  onNewProductUrlInput(index: number): void {
    const group = this.newVideoProducts.at(index);
    const url = group.get('shopUrl')?.value ?? '';
    this.scheduleProductPreview(`new-${index}`, url, (preview, loading) => {
      this.newProductPreviewLoading[index] = loading;
      if (loading) {
        return;
      }
      this.newProductPreview[index] = preview;
      if (preview) {
        group.patchValue({
          name: preview.name,
          imageUrl: preview.imageUrl ?? ''
        });
        if (preview.requiresManualImage) {
          this.toastService.warning(this.manualImageWarning(preview.platform));
        }
      }
    });
  }

  isNewProductPreviewLoading(index: number): boolean {
    return !!this.newProductPreviewLoading[index];
  }

  getNewProductPreview(index: number): ProductPreview | null {
    return this.newProductPreview[index] ?? null;
  }

  saveProduct(video: AdminVideoMock): void {
    if (this.editingProductId) {
      if (this.productEditForm.invalid) {
        this.productEditForm.markAllAsTouched();
        this.toastService.warning('Uzupełnij wymagane pola produktu.');
        return;
      }
      const value = this.productEditForm.getRawValue();
      video.products = video.products.map((product) =>
        product.id === this.editingProductId
          ? {
              ...product,
              name: value.name!,
              imageUrl: value.imageUrl ?? '',
              shopUrl: value.shopUrl!
            }
          : product
      );
      this.cancelProductForm();
      return;
    }
    if (this.productAddForm.invalid) {
      this.productAddForm.markAllAsTouched();
      this.toastService.warning('Podaj adres URL sklepu produktu.');
      return;
    }
    const value = this.productAddForm.getRawValue();
    if (this.isAllegroShopUrl(value.shopUrl!) && !value.imageUrl?.trim()) {
      this.toastService.warning('Dla Allegro dodaj URL obrazka lub prześlij plik zdjęcia.');
      return;
    }
    this.videoService
      .addProduct(video.id, {
        name: value.name || undefined,
        imageUrl: value.imageUrl || undefined,
        productLink: {
          url: value.shopUrl!,
          type: 'product'
        }
      })
      .subscribe(() => {
        this.toastService.success('Produkt został dodany do filmu.');
        this.cancelProductForm();
        this.refreshVideo(video.id);
      });
  }

  detachProduct(video: AdminVideoMock, productId: number): void {
    this.videoService.detachProduct(video.id, productId).subscribe(() => {
      this.toastService.success('Produkt został odpięty od filmu.');
      if (this.editingProductId === productId) {
        this.cancelProductForm();
      }
      this.refreshVideo(video.id);
    });
  }

  resyncProduct(video: AdminVideoMock, productId: number): void {
    this.videoService.resyncProduct(video.id, productId).subscribe(() => {
      this.toastService.success('Dane produktu zostały odświeżone.');
      this.refreshVideo(video.id);
    });
  }

  toggleNewVideoCategory(categoryId: number): void {
    const index = this.newVideoCategoryIds.value.indexOf(categoryId);
    if (index >= 0) {
      this.newVideoCategoryIds.removeAt(index);
    } else {
      this.newVideoCategoryIds.push(this.fb.control(categoryId, { nonNullable: true }));
    }
  }

  isNewVideoCategoryActive(categoryId: number): boolean {
    return this.newVideoCategoryIds.value.includes(categoryId);
  }

  addNewVideoProduct(): void {
    this.showNewProductForm = true;
    const index = this.newVideoProducts.length;
    this.newVideoProducts.push(
      this.fb.group({
        shopUrl: ['', Validators.required],
        name: [''],
        imageUrl: ['']
      })
    );
    this.newProductPreviewLoading[index] = false;
    this.newProductPreview[index] = null;
  }

  removeNewVideoProduct(index: number): void {
    this.newVideoProducts.removeAt(index);
    this.showNewProductForm = this.newVideoProducts.length > 0;
    delete this.newProductPreviewLoading[index];
    delete this.newProductPreview[index];
    this.clearPreviewTimer(`new-${index}`);
  }

  saveNewVideo(): void {
    if (this.newVideoForm.invalid) {
      this.newVideoForm.markAllAsTouched();
      this.toastService.warning('Uzupełnij wymagane pola nowego filmu.');
      return;
    }
    const value = this.newVideoForm.getRawValue();
    const products = this.newVideoProducts.controls.map((group) => {
      const product = group.getRawValue();
      return {
        name: product['name'] as string | undefined,
        imageUrl: product['imageUrl'] as string | undefined,
        productLink: {
          url: product['shopUrl'] as string,
          type: 'product' as const
        }
      };
    });
    this.videoService
      .create({
        title: value.title!,
        tiktokUrl: value.tiktokUrl!,
        isActive: value.isActive ?? true,
        products
      })
      .subscribe(() => {
        this.toastService.success('Film został dodany.');
        this.resetNewVideoForm();
        this.loadVideos();
      });
  }

  resetNewVideoForm(): void {
    this.newVideoForm.reset({ title: '', tiktokUrl: '', isActive: true });
    this.newVideoCategoryIds.clear();
    this.newVideoProducts.clear();
    this.showNewProductForm = false;
    this.newProductPreviewLoading = {};
    this.newProductPreview = {};
  }

  private scheduleProductPreview(
    key: string,
    url: string,
    onResult: (preview: ProductPreview | null, loading: boolean) => void
  ): void {
    this.clearPreviewTimer(key);
    const trimmed = url.trim();
    if (!trimmed || !this.isSupportedProductUrl(trimmed)) {
      onResult(null, false);
      return;
    }
    onResult(null, true);
    const timer = setTimeout(() => {
      this.previewTimers.delete(key);
      this.productPreviewService.preview(trimmed).subscribe({
        next: (preview) => onResult(preview, false),
        error: () => onResult(null, false)
      });
    }, 450);
    this.previewTimers.set(key, timer);
  }

  private clearPreviewTimer(key: string): void {
    const existing = this.previewTimers.get(key);
    if (existing) {
      clearTimeout(existing);
      this.previewTimers.delete(key);
    }
  }

  private handleProductImageUpload(event: Event, onSuccess: (imageUrl: string) => void): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    this.productImageUploadService.upload(file).subscribe({
      next: (response) => {
        onSuccess(response.imageUrl);
        this.toastService.success('Zdjęcie produktu zostało przesłane.');
        input.value = '';
      },
      error: () => {
        input.value = '';
      }
    });
  }

  isAllegroShopUrl(url: string | null | undefined): boolean {
    if (!url?.trim()) {
      return false;
    }
    try {
      return new URL(url.trim()).hostname.toLowerCase().includes('allegro.');
    } catch {
      return false;
    }
  }

  private manualImageWarning(_platform: string): string {
    return 'Allegro blokuje automatyczne pobieranie zdjęć. Wklej URL obrazka lub prześlij plik.';
  }

  private isSupportedProductUrl(url: string): boolean {
    try {
      const host = new URL(url).hostname.toLowerCase();
      return (
        host.includes('temu.com') ||
        host.includes('aliexpress.') ||
        host.includes('allegro.') ||
        host.includes('amazon.') ||
        host === 'amzn.to' ||
        host.endsWith('.amzn.to')
      );
    } catch {
      return false;
    }
  }

  private refreshVideo(videoId: number): void {
    this.videoService.getById(videoId).subscribe((video) => {
      const updated = this.toAdminVideo(video);
      this.videos = this.videos.map((item) => (item.id === videoId ? updated : item));
      if (this.openedVideoId === videoId) {
        this.videoForm.reset({
          title: updated.title,
          tiktokUrl: updated.tiktokUrl,
          isActive: updated.isActive
        });
      }
    });
  }

  private loadVideos(): void {
    this.videoService.getVideos().subscribe((videos) => {
      this.videos = videos.map((video) => this.toAdminVideo(video));
    });
  }

  private toAdminVideo(video: Video): AdminVideoMock {
    return {
      id: video.id,
      title: video.title,
      tiktokUrl: video.tiktokUrl,
      previewImageUrl: video.previewImageUrl,
      isActive: video.isActive,
      categoryIds: [...video.categoryIds],
      products: video.products.map((product) => ({
        id: product.id,
        name: product.name,
        imageUrl: product.imageUrl,
        shopUrl: product.productLink.url
      }))
    };
  }
}
