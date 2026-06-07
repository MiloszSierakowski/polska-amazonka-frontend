import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { DiscountCode } from '../../models/discount-code.model';
import { AffiliateCode } from '../../models/affiliate-code.model';
import { DiscountCodeService } from '../../services/discount-code.service';
import { AffiliateCodeService } from '../../services/affiliate-code.service';
import { ToastService } from '../../../../core/admin/toast.service';
import { Shop } from '../../../../core/models/shop.model';
import { ShopService } from '../../../../core/services/shop.service';

type DeleteTargetType = 'discount' | 'affiliate';

interface DeleteTarget {
  type: DeleteTargetType;
  id: number;
}

@Component({
  selector: 'app-admin-discounts-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DragDropModule],
  templateUrl: './admin-discounts-section.component.html',
  styleUrl: './admin-discounts-section.component.scss'
})
export class AdminDiscountsSectionComponent implements OnInit {
  discountItems: DiscountCode[] = [];
  affiliateItems: AffiliateCode[] = [];
  shops: Shop[] = [];
  editingDiscountId: number | null = null;
  editingAffiliateId: number | null = null;
  isDiscountModalOpen = false;
  isAffiliateModalOpen = false;
  deleteModalOpen = false;
  deleteTarget: DeleteTarget | null = null;
  isDeleting = false;
  isSavingDiscountOrder = false;
  isSavingAffiliateOrder = false;

  discountAddForm = this.fb.group({
    shopId: [null as number | null, Validators.required],
    codeValue: ['', Validators.required],
    description: ['', Validators.required],
    isActive: [true]
  });

  discountEditForm = this.fb.group({
    shopId: [null as number | null, Validators.required],
    codeValue: ['', Validators.required],
    description: ['', Validators.required],
    isActive: [true]
  });

  affiliateAddForm = this.fb.group({
    shopId: [null as number | null, Validators.required],
    codeValue: ['', Validators.required],
    isActive: [true]
  });

  affiliateEditForm = this.fb.group({
    shopId: [null as number | null, Validators.required],
    codeValue: ['', Validators.required],
    isActive: [true]
  });

  constructor(
    private fb: FormBuilder,
    private discountCodeService: DiscountCodeService,
    private affiliateCodeService: AffiliateCodeService,
    private shopService: ShopService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadShops();
    this.loadDiscountCodes();
    this.loadAffiliateCodes();
  }

  get canAddDiscountCode(): boolean {
    return this.discountItems.length < this.shops.length;
  }

  openAddDiscountModal(): void {
    if (!this.canAddDiscountCode) {
      this.toastService.warning('Każdy sklep ma już przypisany kod rabatowy.');
      return;
    }
    this.cancelEditDiscount();
    this.discountAddForm.reset({ shopId: null, codeValue: '', description: '', isActive: true });
    this.isDiscountModalOpen = true;
  }

  closeDiscountModal(): void {
    this.isDiscountModalOpen = false;
    this.discountAddForm.reset({ shopId: null, codeValue: '', description: '', isActive: true });
  }

  startEditDiscount(item: DiscountCode): void {
    if (this.editingDiscountId === item.id) {
      this.cancelEditDiscount();
      return;
    }
    this.editingDiscountId = item.id;
    this.discountEditForm.reset({
      shopId: item.shopId,
      codeValue: item.codeValue,
      description: item.description,
      isActive: item.isActive
    });
  }

  cancelEditDiscount(): void {
    this.editingDiscountId = null;
    this.discountEditForm.reset({ shopId: null, codeValue: '', description: '', isActive: true });
  }

  saveNewDiscount(): void {
    const payload = this.buildDiscountPayload(this.discountAddForm);
    if (!payload) {
      return;
    }
    this.discountCodeService.create(payload).subscribe(() => {
      this.toastService.success('Kod rabatowy został zapisany.');
      this.closeDiscountModal();
      this.loadDiscountCodes();
    });
  }

  saveEditDiscount(item: DiscountCode): void {
    const payload = this.buildDiscountPayload(this.discountEditForm);
    if (!payload) {
      return;
    }
    this.discountCodeService.update(item.id, payload).subscribe(() => {
      this.toastService.success('Kod rabatowy został zaktualizowany.');
      this.cancelEditDiscount();
      this.loadDiscountCodes();
    });
  }

  openAddAffiliateModal(): void {
    this.cancelEditAffiliate();
    this.affiliateAddForm.reset({ shopId: null, codeValue: '', isActive: true });
    this.isAffiliateModalOpen = true;
  }

  closeAffiliateModal(): void {
    this.isAffiliateModalOpen = false;
    this.affiliateAddForm.reset({ shopId: null, codeValue: '', isActive: true });
  }

  startEditAffiliate(item: AffiliateCode): void {
    if (this.editingAffiliateId === item.id) {
      this.cancelEditAffiliate();
      return;
    }
    this.editingAffiliateId = item.id;
    this.affiliateEditForm.reset({
      shopId: item.shopId,
      codeValue: item.codeValue,
      isActive: item.isActive
    });
  }

  cancelEditAffiliate(): void {
    this.editingAffiliateId = null;
    this.affiliateEditForm.reset({ shopId: null, codeValue: '', isActive: true });
  }

  isAffiliateShopDisabled(shopId: number): boolean {
    if (this.editingAffiliateId != null) {
      return false;
    }
    return this.affiliateItems.some((item) => item.shopId === shopId && item.isActive);
  }

  saveNewAffiliate(): void {
    const payload = this.buildAffiliatePayload(this.affiliateAddForm);
    if (!payload) {
      return;
    }
    this.affiliateCodeService.create(payload).subscribe({
      next: () => {
        this.toastService.success('Kod afiliacyjny został zapisany.');
        this.closeAffiliateModal();
        this.loadAffiliateCodes();
      },
      error: () => {}
    });
  }

  saveEditAffiliate(item: AffiliateCode): void {
    const payload = this.buildAffiliatePayload(this.affiliateEditForm);
    if (!payload) {
      return;
    }
    this.affiliateCodeService.update(item.id, payload).subscribe({
      next: () => {
        this.toastService.success('Kod afiliacyjny został zaktualizowany.');
        this.cancelEditAffiliate();
        this.loadAffiliateCodes();
      },
      error: () => {}
    });
  }

  dropDiscount(event: CdkDragDrop<DiscountCode[]>): void {
    if (event.previousIndex === event.currentIndex || this.isSavingDiscountOrder) {
      return;
    }
    moveItemInArray(this.discountItems, event.previousIndex, event.currentIndex);
    this.isSavingDiscountOrder = true;
    const orderedIds = this.discountItems.map((item) => item.id);
    this.discountCodeService.reorder(orderedIds).subscribe({
      next: () => {
        this.isSavingDiscountOrder = false;
        this.toastService.success('Kolejność kodów rabatowych została zapisana.');
      },
      error: () => {
        this.isSavingDiscountOrder = false;
        this.loadDiscountCodes();
      }
    });
  }

  dropAffiliate(event: CdkDragDrop<AffiliateCode[]>): void {
    if (event.previousIndex === event.currentIndex || this.isSavingAffiliateOrder) {
      return;
    }
    moveItemInArray(this.affiliateItems, event.previousIndex, event.currentIndex);
    this.isSavingAffiliateOrder = true;
    const orderedIds = this.affiliateItems.map((item) => item.id);
    this.affiliateCodeService.reorder(orderedIds).subscribe({
      next: () => {
        this.isSavingAffiliateOrder = false;
        this.toastService.success('Kolejność kodów afiliacyjnych została zapisana.');
      },
      error: () => {
        this.isSavingAffiliateOrder = false;
        this.loadAffiliateCodes();
      }
    });
  }

  openDeleteModal(type: DeleteTargetType, id: number): void {
    this.deleteTarget = { type, id };
    this.deleteModalOpen = true;
  }

  cancelDelete(): void {
    if (this.isDeleting) {
      return;
    }
    this.deleteModalOpen = false;
    this.deleteTarget = null;
  }

  confirmDelete(): void {
    if (!this.deleteTarget || this.isDeleting) {
      return;
    }
    this.isDeleting = true;
    const target = this.deleteTarget;
    const request$ = target.type === 'discount'
      ? this.discountCodeService.delete(target.id)
      : this.affiliateCodeService.delete(target.id);

    request$.subscribe({
      next: () => {
        this.isDeleting = false;
        this.deleteModalOpen = false;
        this.deleteTarget = null;
        if (target.type === 'discount') {
          if (this.editingDiscountId === target.id) {
            this.cancelEditDiscount();
          }
          this.loadDiscountCodes();
          this.toastService.success('Kod rabatowy został usunięty.');
          return;
        }
        if (this.editingAffiliateId === target.id) {
          this.cancelEditAffiliate();
        }
        this.loadAffiliateCodes();
        this.toastService.success('Kod afiliacyjny został usunięty.');
      },
      error: () => {
        this.isDeleting = false;
      }
    });
  }

  private buildDiscountPayload(form: typeof this.discountAddForm) {
    if (form.invalid) {
      form.markAllAsTouched();
      this.toastService.warning('Uzupełnij wymagane pola formularza kodu rabatowego.');
      return null;
    }
    const value = form.getRawValue();
    return {
      shopId: value.shopId!,
      codeValue: value.codeValue!,
      description: value.description!,
      isActive: value.isActive ?? true
    };
  }

  private buildAffiliatePayload(form: typeof this.affiliateAddForm) {
    if (form.invalid) {
      form.markAllAsTouched();
      this.toastService.warning('Uzupełnij wymagane pola formularza kodu afiliacyjnego.');
      return null;
    }
    const value = form.getRawValue();
    return {
      shopId: value.shopId!,
      codeValue: value.codeValue!,
      isActive: value.isActive ?? true
    };
  }

  private loadShops(): void {
    this.shopService.getAllActive().subscribe((shops) => {
      this.shops = shops;
    });
  }

  private loadDiscountCodes(): void {
    this.discountCodeService.getAll().subscribe((items) => {
      this.discountItems = items;
    });
  }

  private loadAffiliateCodes(): void {
    this.affiliateCodeService.getAll().subscribe((items) => {
      this.affiliateItems = items;
    });
  }
}
