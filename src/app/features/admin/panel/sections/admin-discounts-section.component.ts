import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DiscountCode } from '../../models/discount-code.model';
import { AffiliateCode } from '../../models/affiliate-code.model';
import { DiscountCodeService } from '../../services/discount-code.service';
import { AffiliateCodeService } from '../../services/affiliate-code.service';

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
  discountSuccessMessage: string | null = null;
  affiliateSuccessMessage: string | null = null;

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
    private affiliateCodeService: AffiliateCodeService
  ) {}

  ngOnInit(): void {
    this.loadDiscountCodes();
    this.loadAffiliateCodes();
  }

  startAddDiscount(): void {
    this.editingDiscountId = null;
    this.discountForm.reset({ platform: '', codeValue: '', description: '', isActive: true });
    this.discountSuccessMessage = null;
  }

  startEditDiscount(item: DiscountCode): void {
    this.editingDiscountId = item.id;
    this.discountSuccessMessage = null;
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
        this.showDiscountSuccess('Kod rabatowy został zaktualizowany.');
        this.startAddDiscount();
        this.loadDiscountCodes();
      });
      return;
    }
    this.discountCodeService.create(payload).subscribe(() => {
      this.showDiscountSuccess('Kod rabatowy został zapisany.');
      this.startAddDiscount();
      this.loadDiscountCodes();
    });
  }

  startAddAffiliate(): void {
    this.editingAffiliateId = null;
    this.affiliateForm.reset({ platform: '', codeValue: '', isActive: true });
    this.affiliateSuccessMessage = null;
  }

  startEditAffiliate(item: AffiliateCode): void {
    this.editingAffiliateId = item.id;
    this.affiliateSuccessMessage = null;
    this.affiliateForm.patchValue({
      platform: item.platform,
      codeValue: item.codeValue,
      isActive: item.isActive
    });
  }

  saveAffiliate(): void {
    if (this.affiliateForm.invalid) {
      this.affiliateForm.markAllAsTouched();
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
        this.showAffiliateSuccess('Kod afiliacyjny został zaktualizowany.');
        this.startAddAffiliate();
        this.loadAffiliateCodes();
      });
      return;
    }
    this.affiliateCodeService.create(payload).subscribe(() => {
      this.showAffiliateSuccess('Kod afiliacyjny został zapisany.');
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

  private showDiscountSuccess(message: string): void {
    this.discountSuccessMessage = message;
    window.setTimeout(() => {
      if (this.discountSuccessMessage === message) {
        this.discountSuccessMessage = null;
      }
    }, 4000);
  }

  private showAffiliateSuccess(message: string): void {
    this.affiliateSuccessMessage = message;
    window.setTimeout(() => {
      if (this.affiliateSuccessMessage === message) {
        this.affiliateSuccessMessage = null;
      }
    }, 4000);
  }
}
