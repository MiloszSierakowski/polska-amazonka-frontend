export type ProductLinkReviewStatus = 'working' | 'broken' | 'needs_review';

export interface BrokenLinkProduct {
  videoId: number;
  videoTitle: string;
  videoPreviewImageUrl: string | null;
  productId: number;
  productName: string;
  imageUrl: string | null;
  shopUrl: string;
  linkId: number;
  isBroken: boolean;
  needsReview: boolean;
}

export interface BrokenLinkVideoGroup {
  videoId: number;
  videoTitle: string;
  videoPreviewImageUrl: string | null;
  products: BrokenLinkProduct[];
}
