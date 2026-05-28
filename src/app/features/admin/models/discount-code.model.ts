export interface DiscountCode {
  id: number;
  platform: string;
  codeValue: string;
  description: string;
  isActive: boolean;
  createdAt?: string;
}
