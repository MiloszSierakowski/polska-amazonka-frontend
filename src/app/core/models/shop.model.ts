export interface Shop {
  id: number;
  slug: string;
  code: string;
  name: string;
  shopUrl: string | null;
  isActive?: boolean;
  colorCode?: string | null;
}

export interface SaveShopPayload {
  name: string;
  shopUrl?: string | null;
  isActive?: boolean;
  colorCode?: string | null;
}
