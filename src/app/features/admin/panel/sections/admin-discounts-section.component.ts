import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DiscountCode } from '../../models/discount-code.model';
import { AffiliateCode } from '../../models/affiliate-code.model';
import { DiscountCodeService } from '../../services/discount-code.service';
import { AffiliateCodeService } from '../../services/affiliate-code.service';
import { ToastService } from '../../../../core/admin/toast.service';

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
  editingDiscountId: number | null = null;
  editingAffiliateId: number | null = null;

  readonly platforms = ['ALIEXPRESS', 'TEMU'];

  discountForm = this.fb.group({
    platform: ['', Validators.required],
    codeValue: ['', Validators.required],
    description: ['', Validators.required],
    isActive: [true]
  });

  affiliateForm = this.fb.group({
    platform: ['', Validators.required],
    codeValue: ['', Validators.required],
    isActive: [true]
  });

  constructor(
    private fb: FormBuilder,
    private discountCodeService: DiscountCodeService,
    private affiliateCodeService: AffiliateCodeService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadDiscountCodes();
    this.loadAffiliateCodes();
  }

  startAddDiscount(): void {
    this.editingDiscountId = null;
    this.discountForm.reset({ platform: '', codeValue: '', description: '', isActive: true });
  }

  startEditDiscount(item: DiscountCode): void {
    this.editingDiscountId = item.id;
    this.discountForm.patchValue({
      platform: item.platform,
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
      platform: value.platform!,
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
    this.affiliateForm.reset({ platform: '', codeValue: '', isActive: true });
  }

  startEditAffiliate(item: AffiliateCode): void {
    this.editingAffiliateId = item.id;
    this.affiliateForm.patchValue({
      platform: item.platform,
      codeValue: item.codeValue,
      isActive: item.isActive
    });
  }

  saveAffiliate(): void {
    if (this.affiliateForm.invalid) {
      this.affiliateForm.markAllAsTouched();
      this.toastService.warning('Uzupełnij wymagane pola formularza kodu afiliacyjnego.');
      return;
    }
    const value = this.affiliateForm.getRawValue();
    const payload = {
      platform: value.platform!,
      codeValue: value.codeValue!,
      isActive: value.isActive ?? true
    };
    if (this.editingAffiliateId) {
      this.affiliateCodeService.update(this.editingAffiliateId, payload).subscribe(() => {
        this.toastService.success('Kod afiliacyjny został zaktualizowany.');
        this.startAddAffiliate();
        this.loadAffiliateCodes();
      });
      return;
    }
    this.affiliateCodeService.create(payload).subscribe(() => {
      this.toastService.success('Kod afiliacyjny został zapisany.');
      this.startAddAffiliate();
      this.loadAffiliateCodes();
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
