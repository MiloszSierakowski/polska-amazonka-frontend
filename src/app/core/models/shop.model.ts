export interface Shop {
  id: number;
  slug: string;
  code: string;
  name: string;
  shopUrl: string | null;
  isActive?: boolean;
}

export interface SaveShopPayload {
  name: string;
  shopUrl?: string | null;
  isActive?: boolean;
}
