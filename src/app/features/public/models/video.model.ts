export interface ProductLink {
  id: number;
  url: string;
  type: 'product' | 'social' | 'partner' | 'footer' | 'other';
}

export interface Product {
  id: number;
  name: string;
  imageUrl: string;
  tags: string[];
  isBroken?: boolean | null;
  needsReview?: boolean | null;
  productLink: ProductLink;
  promoCode?: string | null;
}

export interface Video {
  id: number;
  title: string;
  tiktokUrl: string;
  previewImageUrl: string;
  isActive: boolean;
  createdAt: string;
  promotionStartAt: string | null;
  promotionEndAt: string | null;
  publicCode?: string | null;
  categoryIds: number[];
  products: Product[];
  blockReasons?: string[];
}
