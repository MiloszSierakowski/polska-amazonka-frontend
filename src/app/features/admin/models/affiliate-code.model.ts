export interface AffiliateCode {
  id: number;
  platform: string;
  codeValue: string;
  description: string | null;
  isActive: boolean;
  createdAt?: string;
}
