export interface ProductLink {
  id: number;
  url: string;
  type: 'product' | 'social' | 'partner' | 'footer' | 'other';
}

export interface Product {
  id: number;
  name: string;
  imageUrl: string;
  productLink: ProductLink;
}

export interface Video {
  id: number;
  title: string;
  tiktokUrl: string;
  previewImageUrl: string;
  isActive: boolean;
  createdAt: string;
  categoryIds: number[];
  products: Product[];
}
