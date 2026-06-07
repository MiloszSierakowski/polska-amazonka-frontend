export interface DiscountCode {
  id: number;
  shopId: number;
  shopName: string;
  shopSlug: string;
  codeValue: string;
  description: string;
  isActive: boolean;
  createdAt?: string;
}
