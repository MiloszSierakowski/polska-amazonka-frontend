export interface AdminProductSearchResult {
  productId: number;
  name: string;
  imageUrl: string | null;
  tags: string[];
  productLink: {
    id: number;
    url: string;
    isActive: boolean | null;
  } | null;
  isBroken: boolean | null;
  needsReview: boolean | null;
  isActive: boolean | null;
  lastCheckedAt: string | null;
  alreadyAssigned: boolean;
}
