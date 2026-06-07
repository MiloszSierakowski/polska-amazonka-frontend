export interface Category {
  id: number;
  name: string;
  imageUrl: string | null;
  shopId?: number | null;
  displayOrder?: number | null;
}
