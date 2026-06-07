export interface AffiliateCode {
  id: number;
  shopId: number;
  shopName: string;
  shopSlug: string;
  codeValue: string;
  description: string | null;
  isActive: boolean;
  createdAt?: string;
}
