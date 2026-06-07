import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Shop } from '../../../../core/models/shop.model';
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
  editingId: number | null = null;
  deleteModalOpen = false;
  deleteTargetId: number | null = null;
  isDeleting = false;

  private readonly shopDeleteBlockedMessage =
    'Nie można usunąć sklepu. Najpierw usuń lub przypisz do innego sklepu powiązane z nim kody rabatowe/afiliacyjne.';

  form = this.fb.group({
    name: ['', Validators.required],
    slug: ['', Validators.required],
    code: ['', Validators.required],
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

  startAdd(): void {
    this.editingId = null;
    this.form.reset({
      name: '',
      slug: '',
      code: '',
      shopUrl: '',
      isActive: true
    });
  }

  startEdit(item: Shop): void {
    this.editingId = item.id;
    this.form.patchValue({
      name: item.name,
      slug: item.slug,
      code: item.code,
      shopUrl: item.shopUrl ?? '',
      isActive: item.isActive ?? true
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastService.warning('Uzupełnij wymagane pola formularza sklepu.');
      return;
    }
    const value = this.form.getRawValue();
    const shopUrl = value.shopUrl?.trim();
    const payload = {
      name: value.name!.trim(),
      slug: value.slug!.trim(),
      code: value.code!.trim(),
      shopUrl: shopUrl ? shopUrl : null,
      isActive: value.isActive ?? true
    };
    if (this.editingId) {
      this.shopService.update(this.editingId, payload).subscribe({
        next: () => {
          this.toastService.success('Sklep został zaktualizowany.');
          this.startAdd();
          this.loadShops();
        },
        error: () => {}
      });
      return;
    }
    this.shopService.create(payload).subscribe({
      next: () => {
        this.toastService.success('Sklep został dodany.');
        this.startAdd();
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
        if (this.editingId === targetId) {
          this.startAdd();
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

  private loadShops(): void {
    this.shopService.getAll().subscribe((shops) => {
      this.items = shops;
    });
  }
}
