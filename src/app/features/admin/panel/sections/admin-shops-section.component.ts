import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Shop, SaveShopPayload } from '../../../../core/models/shop.model';
import { ShopService } from '../../../../core/services/shop.service';
import { ToastService } from '../../../../core/admin/toast.service';

@Component({
  selector: 'app-admin-shops-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-shops-section.component.html',
  styleUrl: './admin-shops-section.component.scss'
})
export class AdminShopsSectionComponent implements OnInit {
  items: Shop[] = [];
  editingShopId: number | null = null;
  isShopModalOpen = false;
  deleteModalOpen = false;
  deleteTargetId: number | null = null;
  isDeleting = false;

  private readonly shopDeleteBlockedMessage =
    'Nie można usunąć sklepu. Najpierw usuń lub przypisz do innego sklepu powiązane z nim kody rabatowe/afiliacyjne.';

  shopAddForm = this.fb.group({
    name: ['', Validators.required],
    shopUrl: [''],
    isActive: [true]
  });

  shopEditForm = this.fb.group({
    name: ['', Validators.required],
    shopUrl: [''],
    isActive: [true]
  });

  constructor(
    private fb: FormBuilder,
    private shopService: ShopService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadShops();
  }

  openAddShopModal(): void {
    this.cancelEdit();
    this.shopAddForm.reset({
      name: '',
      shopUrl: '',
      isActive: true
    });
    this.isShopModalOpen = true;
  }

  closeShopModal(): void {
    this.isShopModalOpen = false;
    this.shopAddForm.reset({
      name: '',
      shopUrl: '',
      isActive: true
    });
  }

  startEdit(item: Shop): void {
    if (this.editingShopId === item.id) {
      this.cancelEdit();
      return;
    }
    this.editingShopId = item.id;
    this.shopEditForm.reset({
      name: item.name,
      shopUrl: item.shopUrl ?? '',
      isActive: item.isActive ?? true
    });
  }

  cancelEdit(): void {
    this.editingShopId = null;
    this.shopEditForm.reset({
      name: '',
      shopUrl: '',
      isActive: true
    });
  }

  saveNewShop(): void {
    const payload = this.buildPayload(this.shopAddForm);
    if (!payload) {
      return;
    }
    this.shopService.create(payload).subscribe({
      next: () => {
        this.toastService.success('Sklep został dodany.');
        this.closeShopModal();
        this.loadShops();
      },
      error: () => {}
    });
  }

  saveEditShop(item: Shop): void {
    const payload = this.buildPayload(this.shopEditForm);
    if (!payload) {
      return;
    }
    this.shopService.update(item.id, payload).subscribe({
      next: () => {
        this.toastService.success('Sklep został zaktualizowany.');
        this.cancelEdit();
        this.loadShops();
      },
      error: () => {}
    });
  }

  openDeleteModal(item: Shop): void {
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
    this.shopService.delete(targetId).subscribe({
      next: () => {
        this.isDeleting = false;
        this.deleteModalOpen = false;
        this.deleteTargetId = null;
        if (this.editingShopId === targetId) {
          this.cancelEdit();
        }
        this.loadShops();
        this.toastService.success('Sklep został usunięty.');
      },
      error: (error: HttpErrorResponse) => {
        this.isDeleting = false;
        if (error.status === 400) {
          this.toastService.warning(this.shopDeleteBlockedMessage);
        }
      }
    });
  }

  private buildPayload(form: typeof this.shopAddForm): SaveShopPayload | null {
    if (form.invalid) {
      form.markAllAsTouched();
      this.toastService.warning('Uzupełnij wymagane pola formularza sklepu.');
      return null;
    }
    const value = form.getRawValue();
    const shopUrl = value.shopUrl?.trim();
    return {
      name: value.name!.trim(),
      shopUrl: shopUrl ? shopUrl : null,
      isActive: value.isActive ?? true
    };
  }

  private loadShops(): void {
    this.shopService.getAll().subscribe((shops) => {
      this.items = shops;
    });
  }
}
