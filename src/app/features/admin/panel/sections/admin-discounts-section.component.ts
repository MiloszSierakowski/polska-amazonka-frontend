import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { AffiliateCode } from '../../models/affiliate-code.model';
import { AffiliateCodeService } from '../../services/affiliate-code.service';
import { ToastService } from '../../../../core/admin/toast.service';
import { Shop } from '../../../../core/models/shop.model';
import { ShopService } from '../../../../core/services/shop.service';
import { ModalNavigationService } from '../../../../core/services/modal-navigation.service';

@Component({
  selector: 'app-admin-discounts-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DragDropModule],
  templateUrl: './admin-discounts-section.component.html',
  styleUrl: './admin-discounts-section.component.scss'
})
export class AdminDiscountsSectionComponent implements OnInit {
  affiliateItems: AffiliateCode[] = [];
  shops: Shop[] = [];
  editingAffiliateId: number | null = null;
  isAffiliateModalOpen = false;
  deleteModalOpen = false;
  deleteTargetId: number | null = null;
  isDeleting = false;
  isSavingAffiliateOrder = false;
  private affiliateModalNavigationId: number | null = null;
  private deleteModalNavigationId: number | null = null;

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
    private affiliateCodeService: AffiliateCodeService,
    private shopService: ShopService,
    private toastService: ToastService,
    private modalNavigationService: ModalNavigationService
  ) {}

  ngOnInit(): void {
    this.loadShops();
    this.loadAffiliateCodes();
  }

  openAddAffiliateModal(): void {
    this.cancelEditAffiliate();
    this.affiliateAddForm.reset({ shopId: null, codeValue: '', isActive: true });
    this.isAffiliateModalOpen = true;
    this.affiliateModalNavigationId = this.modalNavigationService.open(() => this.closeAffiliateModal(true));
  }

  closeAffiliateModal(fromNavigation = false): void {
    if (!fromNavigation) {
      this.affiliateModalNavigationId = this.modalNavigationService.close(this.affiliateModalNavigationId);
    } else {
      this.affiliateModalNavigationId = null;
    }
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

  openDeleteModal(id: number): void {
    this.deleteTargetId = id;
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
    this.deleteTargetId = null;
  }

  confirmDelete(): void {
    if (this.deleteTargetId == null || this.isDeleting) {
      return;
    }
    this.isDeleting = true;
    const targetId = this.deleteTargetId;
    this.affiliateCodeService.delete(targetId).subscribe({
      next: () => {
        this.isDeleting = false;
        this.deleteModalNavigationId = this.modalNavigationService.close(this.deleteModalNavigationId);
        this.deleteModalOpen = false;
        this.deleteTargetId = null;
        if (this.editingAffiliateId === targetId) {
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

  private loadAffiliateCodes(): void {
    this.affiliateCodeService.getAll().subscribe((items) => {
      this.affiliateItems = items;
    });
  }
}
