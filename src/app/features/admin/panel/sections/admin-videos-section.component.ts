import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  AdminVideoMock,
  AdminVideoProductMock,
  MOCK_ADMIN_CATEGORIES
} from '../../mocks/admin-mock.data';
import { VideoService } from '../../../public/services/video.service';
import { Video } from '../../../public/models/video.model';

@Component({
  selector: 'app-admin-videos-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-videos-section.component.html',
  styleUrl: './admin-videos-section.component.scss'
})
export class AdminVideosSectionComponent implements OnInit {
  videos: AdminVideoMock[] = [];
  categories = [...MOCK_ADMIN_CATEGORIES];
  openedVideoId: number | null = null;
  editingProductId: number | null = null;
  showExistingProductForm = false;
  showNewProductForm = false;

  videoForm = this.fb.group({
    title: ['', Validators.required],
    tiktokUrl: ['', Validators.required],
    isActive: [true]
  });

  productForm = this.fb.group({
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
    private videoService: VideoService
  ) {}

  ngOnInit(): void {
    this.loadVideos();
  }

  get newVideoCategoryIds(): FormArray {
    return this.newVideoForm.get('categoryIds') as FormArray;
  }

  get newVideoProducts(): FormArray<FormGroup> {
    return this.newVideoForm.get('products') as FormArray<FormGroup>;
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

  toggleVideoCategory(video: AdminVideoMock, categoryId: number): void {
    video.categoryIds = video.categoryIds.includes(categoryId)
      ? video.categoryIds.filter((id) => id !== categoryId)
      : [...video.categoryIds, categoryId];
  }

  startEditProduct(product: AdminVideoProductMock): void {
    this.editingProductId = product.id;
    this.showExistingProductForm = true;
    this.showNewProductForm = false;
    this.productForm.reset({
      name: product.name,
      imageUrl: product.imageUrl,
      shopUrl: product.shopUrl
    });
  }

  startAddProduct(): void {
    this.editingProductId = null;
    this.showExistingProductForm = true;
    this.showNewProductForm = false;
    this.productForm.reset({ name: '', imageUrl: '', shopUrl: '' });
  }

  cancelProductForm(): void {
    this.editingProductId = null;
    this.showExistingProductForm = false;
    this.showNewProductForm = false;
    this.productForm.reset({ name: '', imageUrl: '', shopUrl: '' });
  }

  saveProduct(video: AdminVideoMock): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }
    const value = this.productForm.getRawValue();
    if (this.editingProductId) {
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
    } else {
      video.products = [
        ...video.products,
        {
          id: this.nextProductId(),
          name: value.name!,
          imageUrl: value.imageUrl ?? '',
          shopUrl: value.shopUrl!
        }
      ];
    }
    this.cancelProductForm();
  }

  detachProduct(video: AdminVideoMock, productId: number): void {
    video.products = video.products.filter((product) => product.id !== productId);
    if (this.editingProductId === productId) {
      this.cancelProductForm();
    }
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
    this.newVideoProducts.push(
      this.fb.group({
        name: ['', Validators.required],
        imageUrl: [''],
        shopUrl: ['', Validators.required]
      })
    );
  }

  removeNewVideoProduct(index: number): void {
    this.newVideoProducts.removeAt(index);
    this.showNewProductForm = this.newVideoProducts.length > 0;
  }

  saveNewVideo(): void {
    if (this.newVideoForm.invalid) {
      this.newVideoForm.markAllAsTouched();
      return;
    }
    const value = this.newVideoForm.getRawValue();
    const video: AdminVideoMock = {
      id: this.nextVideoId(),
      title: value.title!,
      tiktokUrl: value.tiktokUrl!,
      previewImageUrl: 'https://placehold.co/160x220/1a7bb8/ffffff?text=TikTok',
      isActive: value.isActive ?? true,
      categoryIds: value.categoryIds.filter((id): id is number => id !== null),
      products: value.products.map((product) => ({
        id: this.nextProductId(),
        name: product['name'],
        imageUrl: product['imageUrl'] ?? '',
        shopUrl: product['shopUrl']
      }))
    };
    this.videos = [...this.videos, video];
    this.resetNewVideoForm();
  }

  resetNewVideoForm(): void {
    this.newVideoForm.reset({ title: '', tiktokUrl: '', isActive: true });
    this.newVideoCategoryIds.clear();
    this.newVideoProducts.clear();
    this.showNewProductForm = false;
  }

  private nextVideoId(): number {
    return Math.max(0, ...this.videos.map((video) => video.id)) + 1;
  }

  private nextProductId(): number {
    return Math.max(0, ...this.videos.flatMap((video) => video.products.map((product) => product.id))) + 1;
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
      previewImageUrl: video.previewImageUrl || 'https://placehold.co/160x220/1a7bb8/ffffff?text=TikTok',
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
