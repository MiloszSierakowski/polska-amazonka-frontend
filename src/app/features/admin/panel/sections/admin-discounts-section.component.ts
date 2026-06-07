import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-discounts-section.component.html',
  styleUrl: './admin-discounts-section.component.scss'
})
export class AdminDiscountsSectionComponent implements OnInit {
  discountItems: DiscountCode[] = [];
  affiliateItems: AffiliateCode[] = [];
  shops: Shop[] = [];
  editingDiscountId: number | null = null;
  editingAffiliateId: number | null = null;
  deleteModalOpen = false;
  deleteTarget: DeleteTarget | null = null;
  isDeleting = false;

  discountForm = this.fb.group({
    shopId: [null as number | null, Validators.required],
    codeValue: ['', Validators.required],
    description: ['', Validators.required],
    isActive: [true]
  });

  affiliateForm = this.fb.group({
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

  get showDiscountForm(): boolean {
    return this.editingDiscountId !== null || this.canAddDiscountCode;
  }

  startAddDiscount(): void {
    this.editingDiscountId = null;
    this.discountForm.reset({ shopId: null, codeValue: '', description: '', isActive: true });
  }

  startEditDiscount(item: DiscountCode): void {
    this.editingDiscountId = item.id;
    this.discountForm.patchValue({
      shopId: item.shopId,
      codeValue: item.codeValue,
      description: item.description,
      isActive: item.isActive
    });
  }

  saveDiscount(): void {
    if (this.discountForm.invalid) {
      this.discountForm.markAllAsTouched();
      this.toastService.warning('Uzupełnij wymagane pola formularza kodu rabatowego.');
      return;
    }
    const value = this.discountForm.getRawValue();
    const payload = {
      shopId: value.shopId!,
      codeValue: value.codeValue!,
      description: value.description!,
      isActive: value.isActive ?? true
    };
    if (this.editingDiscountId) {
      this.discountCodeService.update(this.editingDiscountId, payload).subscribe(() => {
        this.toastService.success('Kod rabatowy został zaktualizowany.');
        this.startAddDiscount();
        this.loadDiscountCodes();
      });
      return;
    }
    this.discountCodeService.create(payload).subscribe(() => {
      this.toastService.success('Kod rabatowy został zapisany.');
      this.startAddDiscount();
      this.loadDiscountCodes();
    });
  }

  startAddAffiliate(): void {
    this.editingAffiliateId = null;
    this.affiliateForm.reset({ shopId: null, codeValue: '', isActive: true });
  }

  startEditAffiliate(item: AffiliateCode): void {
    this.editingAffiliateId = item.id;
    this.affiliateForm.patchValue({
      shopId: item.shopId,
      codeValue: item.codeValue,
      isActive: item.isActive
    });
  }

  isAffiliateShopDisabled(shopId: number): boolean {
    if (this.editingAffiliateId != null) {
      return false;
    }
    return this.affiliateItems.some((item) => item.shopId === shopId && item.isActive);
  }

  saveAffiliate(): void {
    if (this.affiliateForm.invalid) {
      this.affiliateForm.markAllAsTouched();
      this.toastService.warning('Uzupełnij wymagane pola formularza kodu afiliacyjnego.');
      return;
    }
    const value = this.affiliateForm.getRawValue();
    const payload = {
      shopId: value.shopId!,
      codeValue: value.codeValue!,
      isActive: value.isActive ?? true
    };
    if (this.editingAffiliateId) {
      this.affiliateCodeService.update(this.editingAffiliateId, payload).subscribe({
        next: () => {
          this.toastService.success('Kod afiliacyjny został zaktualizowany.');
          this.startAddAffiliate();
          this.loadAffiliateCodes();
        },
        error: () => {}
      });
      return;
    }
    this.affiliateCodeService.create(payload).subscribe({
      next: () => {
        this.toastService.success('Kod afiliacyjny został zapisany.');
        this.startAddAffiliate();
        this.loadAffiliateCodes();
      },
      error: () => {}
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
            this.startAddDiscount();
          }
          this.loadDiscountCodes();
          this.toastService.success('Kod rabatowy został usunięty.');
          return;
        }
        if (this.editingAffiliateId === target.id) {
          this.startAddAffiliate();
        }
        this.loadAffiliateCodes();
        this.toastService.success('Kod afiliacyjny został usunięty.');
      },
      error: () => {
        this.isDeleting = false;
      }
    });
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
