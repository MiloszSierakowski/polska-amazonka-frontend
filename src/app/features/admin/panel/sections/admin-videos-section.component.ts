import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminVideoMock, AdminVideoProductMock } from '../../mocks/admin-mock.data';
import { VideoService, ProductLinkVerifyResult } from '../../../public/services/video.service';
import { Video } from '../../../public/models/video.model';
import { CategoryService } from '../../../../services/category.service';
import { Category } from '../../../public/models/category.model';
import { parseApiError, resolveProductLinkSaveError } from '../../../../core/admin/api-error.util';
import { ToastService } from '../../../../core/admin/toast.service';
import { ProductPreview, ProductPreviewService } from '../../services/product-preview.service';
import { ProductImageUploadService } from '../../services/product-image-upload.service';
import { ModalNavigationService } from '../../../../core/services/modal-navigation.service';
import { BrokenLinkRefreshService } from '../../services/broken-link-refresh.service';
import {
  VIDEO_PUBLIC_CODE_MAX_LENGTH,
  isVideoPublicCodeBackendMessage,
  normalizeVideoPublicCode,
  videoPublicCodeFormatValidator
} from '../../utils/video-public-code.util';

type AdminVideosViewMode = 'all' | 'promoted';

@Component({
  selector: 'app-admin-videos-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-videos-section.component.html',
  styleUrl: './admin-videos-section.component.scss'
})
export class AdminVideosSectionComponent implements OnInit {
  @Input() viewMode: AdminVideosViewMode = 'all';

  videos: AdminVideoMock[] = [];
  categories: Category[] = [];
  openedVideoId: number | null = null;
  isVideoModalOpen = false;
  modalVideoId: number | null = null;
  deleteModalOpen = false;
  deleteTargetVideo: AdminVideoMock | null = null;
  isDeleting = false;
  editingProductId: number | null = null;
  isAddingNewProduct = false;
  showNewProductForm = false;
  addProductPreviewLoading = false;
  editProductPreviewLoading = false;
  addProductPreview: ProductPreview | null = null;
  editProductPreview: ProductPreview | null = null;
  addProductSelectedFileName = '';
  editProductSelectedFileName = '';
  newProductSelectedFileNames: Record<number, string> = {};
  newProductPreviewLoading: Record<number, boolean> = {};
  newProductPreview: Record<number, ProductPreview | null> = {};
  verifyModalOpen = false;
  verifyLoading = false;
  verifyApplyingTitle = false;
  verifyApplyingImage = false;
  verifyResult: ProductLinkVerifyResult | null = null;
  verifyVideoId: number | null = null;
  verifyProductId: number | null = null;
  editVideoHadPublicCode = false;

  readonly publicCodeMaxLength = VIDEO_PUBLIC_CODE_MAX_LENGTH;

  private readonly previewTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private videoModalNavigationId: number | null = null;
  private deleteModalNavigationId: number | null = null;
  private verifyModalNavigationId: number | null = null;

  videoForm = this.fb.group({
    title: ['', Validators.required],
    tiktokUrl: ['', Validators.required],
    publicCode: [''],
    isActive: [true],
    promotionEnabled: [false],
    promotionStartAt: [{ value: '', disabled: true }],
    promotionEndAt: [{ value: '', disabled: true }]
  });

  productAddForm = this.fb.group({
    shopUrl: ['', Validators.required],
    name: [''],
    imageUrl: [''],
    promoCode: ['']
  });

  productEditForm = this.fb.group({
    name: ['', Validators.required],
    imageUrl: [''],
    shopUrl: ['', Validators.required],
    promoCode: ['']
  });

  newVideoForm = this.fb.group({
    title: ['', Validators.required],
    tiktokUrl: ['', Validators.required],
    publicCode: ['', [Validators.required, Validators.maxLength(VIDEO_PUBLIC_CODE_MAX_LENGTH), videoPublicCodeFormatValidator()]],
    isActive: [true],
    promotionEnabled: [false],
    promotionStartAt: [{ value: '', disabled: true }],
    promotionEndAt: [{ value: '', disabled: true }],
    categoryIds: this.fb.array<number>([]),
    products: this.fb.array<FormGroup>([])
  });

  constructor(
    private fb: FormBuilder,
    private videoService: VideoService,
    private categoryService: CategoryService,
    private toastService: ToastService,
    private productPreviewService: ProductPreviewService,
    private productImageUploadService: ProductImageUploadService,
    private modalNavigationService: ModalNavigationService,
    private brokenLinkRefreshService: BrokenLinkRefreshService
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

  get modalEditingVideo(): AdminVideoMock | null {
    if (this.modalVideoId == null) {
      return null;
    }
    return this.videos.find((video) => video.id === this.modalVideoId) ?? null;
  }

  get visibleVideos(): AdminVideoMock[] {
    if (this.viewMode !== 'promoted') {
      return this.videos;
    }
    return this.videos
      .filter((video) => this.isPromotionVisible(video))
      .sort((a, b) => this.promotionStartTime(b) - this.promotionStartTime(a));
  }

  get isPromotionListView(): boolean {
    return this.viewMode === 'promoted';
  }

  get emptyVideosMessage(): string {
    return this.isPromotionListView ? 'Brak filmów promowanych.' : 'Brak filmów.';
  }

  previewImageSrc(video: AdminVideoMock): string {
    return this.videoService.resolvePreviewImageUrl(video.previewImageUrl);
  }

  publicCodeListLabel(video: AdminVideoMock): string {
    return video.publicCode?.trim() ? video.publicCode : 'Brak kodu';
  }

  hasPublicCode(video: AdminVideoMock): boolean {
    return !!video.publicCode?.trim();
  }

  publicCodeError(form: FormGroup): string | null {
    const control = form.get('publicCode');
    if (!control || (!control.touched && !control.dirty)) {
      return null;
    }
    if (control.hasError('required')) {
      return 'Kod publiczny filmu jest wymagany.';
    }
    if (control.hasError('publicCodeFormat')) {
      return 'Kod ma nieprawidłowy format. Użyj liter, a następnie cyfr, np. A110.';
    }
    if (control.hasError('backend')) {
      return String(control.getError('backend'));
    }
    return null;
  }

  onPublicCodeBlur(form: FormGroup): void {
    const control = form.get('publicCode');
    if (!control) {
      return;
    }
    const normalized = normalizeVideoPublicCode(control.value as string | null | undefined);
    if (normalized != null && normalized !== control.value) {
      control.setValue(normalized, { emitEvent: false });
    }
    control.markAsTouched();
    control.updateValueAndValidity();
  }

  productPreviewImageSrc(imageUrl: string | null | undefined): string {
    return this.videoService.resolveProductImageUrl(imageUrl);
  }

  linkPlatformLabel(url: string): string {
    try {
      const host = new URL(url).hostname.replace(/^www\./i, '').toLowerCase();
      if (host.includes('aliexpress')) {
        return 'AliExpress';
      }
      if (host.includes('allegro')) {
        return 'Allegro';
      }
      if (host.includes('temu')) {
        return 'Temu';
      }
      if (host.includes('amazon')) {
        return 'Amazon';
      }
      return host;
    } catch {
      return 'Sklep';
    }
  }

  toggleProductsPanel(video: AdminVideoMock): void {
    if (this.openedVideoId === video.id) {
      this.openedVideoId = null;
      this.cancelProductForm();
      return;
    }
    this.openedVideoId = video.id;
    this.cancelProductForm();
  }

  openAddVideoModal(): void {
    this.openedVideoId = null;
    this.cancelProductForm();
    this.modalVideoId = null;
    this.newVideoForm.reset({
      title: '',
      tiktokUrl: '',
      publicCode: '',
      isActive: true,
      promotionEnabled: false,
      promotionStartAt: '',
      promotionEndAt: ''
    });
    this.configurePromotionControls(this.newVideoForm, false, false);
    this.newVideoCategoryIds.clear();
    this.newVideoProducts.clear();
    this.showNewProductForm = false;
    this.newProductPreviewLoading = {};
    this.newProductPreview = {};
    this.newProductSelectedFileNames = {};
    this.isVideoModalOpen = true;
    this.videoModalNavigationId = this.modalNavigationService.open(() => this.closeVideoModal(true));
  }

  openEditVideoModal(video: AdminVideoMock): void {
    this.cancelProductForm();
    this.modalVideoId = video.id;
    this.editVideoHadPublicCode = !!video.publicCode?.trim();
    this.patchVideoFormFromVideo(this.videoForm, video);
    this.isVideoModalOpen = true;
    this.videoModalNavigationId = this.modalNavigationService.open(() => this.closeVideoModal(true));
  }

  closeVideoModal(fromNavigation = false): void {
    if (!fromNavigation) {
      this.videoModalNavigationId = this.modalNavigationService.close(this.videoModalNavigationId);
    } else {
      this.videoModalNavigationId = null;
    }
    this.isVideoModalOpen = false;
    this.modalVideoId = null;
    this.editVideoHadPublicCode = false;
    this.resetNewVideoForm(false);
    this.videoForm.reset({
      title: '',
      tiktokUrl: '',
      publicCode: '',
      isActive: true,
      promotionEnabled: false,
      promotionStartAt: '',
      promotionEndAt: ''
    });
    this.configurePromotionControls(this.videoForm, false, false);
  }

  isVideoOpen(video: AdminVideoMock): boolean {
    return this.openedVideoId === video.id;
  }

  onPromotionToggle(form: FormGroup): void {
    const enabled = !!form.get('promotionEnabled')?.value;
    this.configurePromotionControls(form, enabled, true);
  }

  isPromotionEnabled(form: FormGroup): boolean {
    return !!form.get('promotionEnabled')?.value;
  }

  promotionStartError(form: FormGroup): string | null {
    const control = form.get('promotionStartAt');
    if (!this.isPromotionEnabled(form) || !control?.touched) {
      return null;
    }
    if (control.hasError('required')) {
      return 'Podaj datę rozpoczęcia promocji.';
    }
    return null;
  }

  promotionEndError(form: FormGroup): string | null {
    const control = form.get('promotionEndAt');
    if (!this.isPromotionEnabled(form) || !control?.touched) {
      return null;
    }
    if (control.hasError('required')) {
      return 'Podaj datę zakończenia promocji.';
    }
    if (control.hasError('dateOrder')) {
      return 'Data zakończenia musi być późniejsza niż data rozpoczęcia.';
    }
    return null;
  }

  saveVideo(video: AdminVideoMock): void {
    this.normalizePublicCodeControl(this.videoForm);
    if (this.videoForm.invalid || !this.validatePromotionForm(this.videoForm)) {
      this.videoForm.markAllAsTouched();
      return;
    }
    const value = this.videoForm.getRawValue();
    const promotionPayload = this.buildPromotionPayload(this.videoForm);
    const publicCode = this.preparePublicCodeForSave(this.videoForm);
    this.videoService
      .update(video.id, {
        title: value.title!,
        tiktokUrl: value.tiktokUrl!,
        isActive: value.isActive ?? true,
        publicCode,
        promotionStartAt: promotionPayload.promotionStartAt,
        promotionEndAt: promotionPayload.promotionEndAt
      })
      .subscribe({
        next: (updated) => {
          const adminVideo = this.toAdminVideo(updated);
          adminVideo.categoryIds = video.categoryIds;
          this.videos = this.videos.map((item) => (item.id === video.id ? adminVideo : item));
          this.toastService.success('Film został zapisany.');
          this.closeVideoModal();
        },
        error: (error: HttpErrorResponse) => this.handleVideoSaveError(error, this.videoForm)
      });
  }

  openDeleteModal(video: AdminVideoMock): void {
    this.deleteTargetVideo = video;
    this.deleteModalOpen = true;
    this.deleteModalNavigationId = this.modalNavigationService.open(() => this.cancelDelete(true));
  }

  cancelDelete(fromNavigation = false): void {
    if (this.isDeleting) {
      return;
    }
    if (!fromNavigation) {
      this.deleteModalNavigationId = this.modalNavigationService.close(this.deleteModalNavigationId);
    } else {
      this.deleteModalNavigationId = null;
    }
    this.deleteModalOpen = false;
    this.deleteTargetVideo = null;
  }

  confirmDelete(): void {
    const video = this.deleteTargetVideo;
    if (!video || this.isDeleting) {
      return;
    }
    this.isDeleting = true;
    this.videoService.delete(video.id).subscribe({
      next: () => {
        this.isDeleting = false;
        this.deleteModalNavigationId = this.modalNavigationService.close(this.deleteModalNavigationId);
        this.deleteModalOpen = false;
        this.deleteTargetVideo = null;
        this.toastService.success('Film został usunięty.');
        if (this.openedVideoId === video.id) {
          this.openedVideoId = null;
          this.cancelProductForm();
        }
        if (this.modalVideoId === video.id) {
          this.closeVideoModal();
        }
        this.loadVideos();
      },
      error: () => {
        this.isDeleting = false;
      }
    });
  }

  toggleVideoCategory(video: AdminVideoMock, categoryId: number): void {
    video.categoryIds = video.categoryIds.includes(categoryId)
      ? video.categoryIds.filter((id) => id !== categoryId)
      : [...video.categoryIds, categoryId];
  }

  startEditProduct(product: AdminVideoProductMock): void {
    this.editingProductId = product.id;
    this.isAddingNewProduct = false;
    this.editProductPreview = null;
    this.editProductPreviewLoading = false;
    this.productEditForm.reset({
      name: product.name,
      imageUrl: product.imageUrl,
      shopUrl: product.shopUrl,
      promoCode: product.promoCode ?? ''
    });
    this.editProductSelectedFileName = '';
  }

  startAddProduct(): void {
    this.editingProductId = null;
    this.isAddingNewProduct = true;
    this.addProductPreview = null;
    this.addProductPreviewLoading = false;
    this.productAddForm.reset({ shopUrl: '', name: '', imageUrl: '', promoCode: '' });
    this.addProductSelectedFileName = '';
  }

  cancelProductForm(): void {
    this.editingProductId = null;
    this.isAddingNewProduct = false;
    this.addProductPreview = null;
    this.editProductPreview = null;
    this.addProductPreviewLoading = false;
    this.editProductPreviewLoading = false;
    this.addProductSelectedFileName = '';
    this.editProductSelectedFileName = '';
    this.newProductSelectedFileNames = {};
    this.productAddForm.reset({ shopUrl: '', name: '', imageUrl: '', promoCode: '' });
    this.productEditForm.reset({ name: '', imageUrl: '', shopUrl: '', promoCode: '' });
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
    }, (fileName) => {
      this.addProductSelectedFileName = fileName;
    });
  }

  onEditProductImageSelected(event: Event): void {
    this.handleProductImageUpload(event, (imageUrl) => {
      this.productEditForm.patchValue({ imageUrl });
    }, (fileName) => {
      this.editProductSelectedFileName = fileName;
    });
  }

  onNewProductImageSelected(index: number, event: Event): void {
    this.handleProductImageUpload(event, (imageUrl) => {
      this.newVideoProducts.at(index).patchValue({ imageUrl });
    }, (fileName) => {
      this.newProductSelectedFileNames[index] = fileName;
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
      const productId = this.editingProductId;
      this.videoService
        .updateProduct(video.id, productId, {
          name: value.name || undefined,
          imageUrl: value.imageUrl || undefined,
          promoCode: this.normalizeOptionalText(value.promoCode),
          productLink: {
            url: value.shopUrl!,
            type: 'product'
          }
        })
        .subscribe({
          next: () => {
            this.toastService.success('Produkt został zapisany.');
            this.cancelProductForm();
            this.refreshVideo(video.id);
          },
          error: (error: HttpErrorResponse) => this.handleProductSaveError(error)
        });
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
        promoCode: this.normalizeOptionalText(value.promoCode),
        productLink: {
          url: value.shopUrl!,
          type: 'product'
        }
      })
      .subscribe({
        next: () => {
          this.toastService.success('Produkt został dodany do filmu.');
          this.cancelProductForm();
          this.refreshVideo(video.id);
        },
        error: (error: HttpErrorResponse) => this.handleProductSaveError(error)
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

  openVerifyProductModal(videoId: number, productId: number): void {
    this.verifyVideoId = videoId;
    this.verifyProductId = productId;
    this.verifyResult = null;
    this.verifyLoading = true;
    this.verifyModalOpen = true;
    this.verifyModalNavigationId = this.modalNavigationService.open(() => this.closeVerifyModal(true));
    this.videoService.verifyProductLink(videoId, productId).subscribe({
      next: (result) => {
        this.verifyLoading = false;
        this.verifyResult = result;
        this.refreshVideo(videoId);
        this.brokenLinkRefreshService.requestRefresh();
      },
      error: () => {
        this.verifyLoading = false;
        this.toastService.warning('Nie udało się zweryfikować linku produktu.');
        this.closeVerifyModal();
      }
    });
  }

  closeVerifyModal(fromNavigation = false): void {
    if (fromNavigation) {
      this.verifyModalNavigationId = this.modalNavigationService.close(this.verifyModalNavigationId);
    } else {
      this.verifyModalNavigationId = null;
    }
    this.verifyModalOpen = false;
    this.verifyLoading = false;
    this.verifyApplyingTitle = false;
    this.verifyApplyingImage = false;
    this.verifyResult = null;
    this.verifyVideoId = null;
    this.verifyProductId = null;
  }

  applyVerifyStoreTitle(): void {
    if (this.verifyVideoId == null || this.verifyProductId == null || this.verifyApplyingTitle) {
      return;
    }
    this.verifyApplyingTitle = true;
    this.videoService.applyStoreTitleToProduct(this.verifyVideoId, this.verifyProductId).subscribe({
      next: (video) => {
        this.verifyApplyingTitle = false;
        this.syncVideoFromResponse(video);
        const product = video.products.find((item) => item.id === this.verifyProductId);
        if (this.verifyResult && product) {
          this.verifyResult = {
            ...this.verifyResult,
            currentTitle: product.name
          };
        }
        this.toastService.success('Tytuł produktu został nadpisany.');
      },
      error: () => {
        this.verifyApplyingTitle = false;
        this.toastService.warning('Nie udało się nadpisać tytułu produktu.');
      }
    });
  }

  applyVerifyStoreImage(): void {
    if (this.verifyVideoId == null || this.verifyProductId == null || this.verifyApplyingImage) {
      return;
    }
    this.verifyApplyingImage = true;
    this.videoService.applyStoreImageToProduct(this.verifyVideoId, this.verifyProductId).subscribe({
      next: (video) => {
        this.verifyApplyingImage = false;
        this.syncVideoFromResponse(video);
        const product = video.products.find((item) => item.id === this.verifyProductId);
        if (this.verifyResult && product) {
          this.verifyResult = {
            ...this.verifyResult,
            currentImageUrl: product.imageUrl
          };
        }
        this.toastService.success('Obrazek produktu został nadpisany.');
      },
      error: () => {
        this.verifyApplyingImage = false;
        this.toastService.warning('Nie udało się nadpisać obrazka produktu.');
      }
    });
  }

  verifyStoreImageSrc(imageUrl: string | null | undefined): string {
    return this.videoService.resolveProductImageUrl(imageUrl ?? null);
  }

  canApplyVerifyStoreTitle(): boolean {
    return !!this.verifyResult?.storeTitle?.trim();
  }

  canApplyVerifyStoreImage(): boolean {
    return !!this.verifyResult?.storeImageUrl?.trim();
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
        imageUrl: [''],
        promoCode: ['']
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
    delete this.newProductSelectedFileNames[index];
    this.clearPreviewTimer(`new-${index}`);
  }

  startAddingNewVideo(): void {
    this.openAddVideoModal();
  }

  cancelAddingNewVideo(): void {
    this.closeVideoModal();
  }

  saveNewVideo(): void {
    this.normalizePublicCodeControl(this.newVideoForm);
    if (this.newVideoForm.invalid || !this.validatePromotionForm(this.newVideoForm)) {
      this.newVideoForm.markAllAsTouched();
      this.toastService.warning('Uzupełnij wymagane pola nowego filmu.');
      return;
    }
    const value = this.newVideoForm.getRawValue();
    const promotionPayload = this.buildPromotionPayload(this.newVideoForm);
    const publicCode = this.preparePublicCodeForSave(this.newVideoForm);
    if (!publicCode) {
      this.newVideoForm.get('publicCode')?.markAsTouched();
      this.toastService.warning('Kod publiczny filmu jest wymagany.');
      return;
    }
    const products = this.newVideoProducts.controls.map((group) => {
      const product = group.getRawValue();
      return {
        name: product['name'] as string | undefined,
        imageUrl: product['imageUrl'] as string | undefined,
        promoCode: this.normalizeOptionalText(product['promoCode'] as string | null | undefined),
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
        publicCode,
        promotionStartAt: promotionPayload.promotionStartAt,
        promotionEndAt: promotionPayload.promotionEndAt,
        products
      })
      .subscribe({
        next: () => {
          this.toastService.success('Film został dodany.');
          this.closeVideoModal();
          this.loadVideos();
        },
        error: (error: HttpErrorResponse) => this.handleVideoSaveError(error, this.newVideoForm)
      });
  }

  resetNewVideoForm(closeModal = true): void {
    this.newVideoForm.reset({
      title: '',
      tiktokUrl: '',
      publicCode: '',
      isActive: true,
      promotionEnabled: false,
      promotionStartAt: '',
      promotionEndAt: ''
    });
    this.configurePromotionControls(this.newVideoForm, false, false);
    this.newVideoCategoryIds.clear();
    this.newVideoProducts.clear();
    this.showNewProductForm = false;
    this.newProductPreviewLoading = {};
    this.newProductPreview = {};
    this.newProductSelectedFileNames = {};
    if (closeModal) {
      this.isVideoModalOpen = false;
      this.modalVideoId = null;
    }
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

  private handleProductImageUpload(
    event: Event,
    onSuccess: (imageUrl: string) => void,
    onFileSelected?: (fileName: string) => void
  ): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    onFileSelected?.(file.name);
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
      this.syncVideoFromResponse(video);
      if (this.openedVideoId === videoId) {
        this.patchVideoFormFromVideo(this.videoForm, this.toAdminVideo(video));
      }
      if (this.modalVideoId === videoId) {
        const adminVideo = this.toAdminVideo(video);
        this.editVideoHadPublicCode = !!adminVideo.publicCode?.trim();
        this.patchVideoFormFromVideo(this.videoForm, adminVideo);
      }
    });
  }

  private patchVideoFormFromVideo(form: FormGroup, video: AdminVideoMock): void {
    const promotionEnabled = !!video.promotionStartAt && !!video.promotionEndAt;
    form.reset({
      title: video.title,
      tiktokUrl: video.tiktokUrl,
      publicCode: video.publicCode ?? '',
      isActive: video.isActive,
      promotionEnabled,
      promotionStartAt: this.toDateTimeLocalValue(video.promotionStartAt),
      promotionEndAt: this.toDateTimeLocalValue(video.promotionEndAt)
    });
    this.configurePromotionControls(form, promotionEnabled, false);
    this.configurePublicCodeControl(form, this.editVideoHadPublicCode);
  }

  private configurePublicCodeControl(form: FormGroup, requiresCode: boolean): void {
    const control = form.get('publicCode');
    if (!control) {
      return;
    }
    const validators = [Validators.maxLength(VIDEO_PUBLIC_CODE_MAX_LENGTH), videoPublicCodeFormatValidator()];
    if (requiresCode) {
      validators.unshift(Validators.required);
    }
    control.setValidators(validators);
    control.updateValueAndValidity({ emitEvent: false });
  }

  private normalizePublicCodeControl(form: FormGroup): void {
    const control = form.get('publicCode');
    if (!control) {
      return;
    }
    const normalized = normalizeVideoPublicCode(control.value as string | null | undefined);
    if (normalized != null && normalized !== control.value) {
      control.setValue(normalized, { emitEvent: false });
    }
    control.updateValueAndValidity({ emitEvent: false });
  }

  private preparePublicCodeForSave(form: FormGroup): string | null {
    this.normalizePublicCodeControl(form);
    const control = form.get('publicCode');
    const normalized = normalizeVideoPublicCode(control?.value as string | null | undefined);
    if (!normalized) {
      return null;
    }
    return normalized;
  }

  private handleVideoSaveError(error: HttpErrorResponse, form: FormGroup): void {
    const message =
      error.status === 400 ? resolveProductLinkSaveError(error) : parseApiError(error).message;
    if (error.status === 400 || error.status === 409) {
      this.applyPublicCodeBackendError(form, message);
      this.toastService.warning(message);
      return;
    }
    this.toastService.warning(message);
  }

  private applyPublicCodeBackendError(form: FormGroup, message: string): void {
    if (!isVideoPublicCodeBackendMessage(message)) {
      return;
    }
    const control = form.get('publicCode');
    if (!control) {
      return;
    }
    control.setErrors({
      ...(this.withoutError(control.errors, 'publicCodeFormat') ?? {}),
      backend: message
    });
    control.markAsTouched();
  }

  private configurePromotionControls(form: FormGroup, enabled: boolean, fillDefaultStart: boolean): void {
    const startControl = form.get('promotionStartAt');
    const endControl = form.get('promotionEndAt');
    if (!startControl || !endControl) {
      return;
    }

    if (enabled) {
      startControl.enable({ emitEvent: false });
      endControl.enable({ emitEvent: false });
      startControl.setValidators([Validators.required]);
      endControl.setValidators([Validators.required]);
      if (fillDefaultStart && !startControl.value) {
        startControl.setValue(this.toDateTimeLocalValue(new Date().toISOString()));
      }
    } else {
      startControl.clearValidators();
      endControl.clearValidators();
      startControl.setValue('');
      endControl.setValue('');
      startControl.disable({ emitEvent: false });
      endControl.disable({ emitEvent: false });
    }

    startControl.updateValueAndValidity({ emitEvent: false });
    endControl.updateValueAndValidity({ emitEvent: false });
  }

  private validatePromotionForm(form: FormGroup): boolean {
    const startControl = form.get('promotionStartAt');
    const endControl = form.get('promotionEndAt');
    if (!this.isPromotionEnabled(form) || !startControl || !endControl) {
      return true;
    }

    const startValue = startControl.value;
    const endValue = endControl.value;
    startControl.setErrors(this.withoutError(startControl.errors, 'dateOrder'));
    endControl.setErrors(this.withoutError(endControl.errors, 'dateOrder'));

    if (!startValue || !endValue) {
      startControl.updateValueAndValidity({ emitEvent: false });
      endControl.updateValueAndValidity({ emitEvent: false });
      return false;
    }

    const startTime = new Date(startValue).getTime();
    const endTime = new Date(endValue).getTime();
    if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime <= startTime) {
      endControl.setErrors({ ...(endControl.errors ?? {}), dateOrder: true });
      return false;
    }

    return true;
  }

  private withoutError(errors: Record<string, unknown> | null, key: string): Record<string, unknown> | null {
    if (!errors || !errors[key]) {
      return errors;
    }
    const next = { ...errors };
    delete next[key];
    return Object.keys(next).length ? next : null;
  }

  private buildPromotionPayload(form: FormGroup): { promotionStartAt: string | null; promotionEndAt: string | null } {
    if (!this.isPromotionEnabled(form)) {
      return {
        promotionStartAt: null,
        promotionEndAt: null
      };
    }
    const value = form.getRawValue();
    return {
      promotionStartAt: this.toIsoString(value['promotionStartAt']),
      promotionEndAt: this.toIsoString(value['promotionEndAt'])
    };
  }

  private toIsoString(value: string | null | undefined): string | null {
    if (!value) {
      return null;
    }
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date.toISOString() : null;
  }

  private toDateTimeLocalValue(value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) {
      return '';
    }
    const offsetMs = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
  }

  private normalizeOptionalText(value: string | null | undefined): string | null {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  }

  private isPromotionVisible(video: AdminVideoMock): boolean {
    if (!video.promotionStartAt || !video.promotionEndAt) {
      return false;
    }
    const endTime = new Date(video.promotionEndAt).getTime();
    return Number.isFinite(endTime) && endTime > Date.now();
  }

  private promotionStartTime(video: AdminVideoMock): number {
    if (!video.promotionStartAt) {
      return 0;
    }
    const startTime = new Date(video.promotionStartAt).getTime();
    return Number.isFinite(startTime) ? startTime : 0;
  }

  private syncVideoFromResponse(video: Video): void {
    const updated = this.toAdminVideo(video);
    this.videos = this.videos.map((item) => (item.id === video.id ? updated : item));
  }

  private loadVideos(): void {
    this.videoService.getVideos().subscribe((videos) => {
      this.videos = videos.map((video) => this.toAdminVideo(video));
    });
  }

  private handleProductSaveError(error: HttpErrorResponse): void {
    this.toastService.warning(resolveProductLinkSaveError(error));
  }

  private toAdminVideo(video: Video): AdminVideoMock {
    return {
      id: video.id,
      title: video.title,
      tiktokUrl: video.tiktokUrl,
      previewImageUrl: video.previewImageUrl,
      isActive: video.isActive,
      promotionStartAt: video.promotionStartAt,
      promotionEndAt: video.promotionEndAt,
      publicCode: video.publicCode ?? null,
      categoryIds: [...video.categoryIds],
      blockReasons: [...(video.blockReasons ?? [])],
      products: video.products.map((product) => ({
        id: product.id,
        name: product.name,
        imageUrl: product.imageUrl,
        shopUrl: product.productLink.url,
        promoCode: product.promoCode ?? null
      }))
    };
  }
}
