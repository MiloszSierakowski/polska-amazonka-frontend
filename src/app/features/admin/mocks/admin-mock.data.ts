import { AdminUser } from '../models/admin-user.model';

export interface AdminCategoryMock {
  id: number;
  name: string;
}

export interface AdminVideoProductMock {
  id: number;
  name: string;
  imageUrl: string;
  shopUrl: string;
}

export interface AdminVideoMock {
  id: number;
  title: string;
  tiktokUrl: string;
  previewImageUrl: string;
  isActive: boolean;
  categoryIds: number[];
  products: AdminVideoProductMock[];
}

export interface AdminDiscountMock {
  id: number;
  platform: string;
  codeValue: string;
  type: 'AFFILIATE' | 'DISCOUNT';
  isActive: boolean;
}

export const MOCK_ADMIN_CATEGORIES: AdminCategoryMock[] = [
  { id: 1, name: 'topka' },
  { id: 2, name: 'temu' },
  { id: 3, name: 'aliexpress' },
  { id: 4, name: 'dom' },
  { id: 5, name: 'znaleziska' },
  { id: 6, name: 'dzieci' },
  { id: 7, name: 'zwierzęta' }
];

export const MOCK_ADMIN_VIDEOS: AdminVideoMock[] = [
  {
    id: 1,
    title: 'Domowe gadżety #1',
    tiktokUrl: 'https://www.tiktok.com/@polskaamazonka/video/7575195848292715779',
    previewImageUrl: 'https://placehold.co/160x220/1a7bb8/ffffff?text=TikTok',
    isActive: true,
    categoryIds: [1, 4],
    products: [
      {
        id: 1,
        name: 'Miska do robota kuchennego',
        imageUrl: 'https://img.kwcdn.com/product/fancy/60f70492-8d28-4688-9cac-567e5e5a6724.jpg',
        shopUrl: 'https://pl.aliexpress.com/item/1005010213859411.html'
      },
      {
        id: 2,
        name: 'Organizer na bluzy',
        imageUrl: 'https://img.kwcdn.com/product/fancy/2a3e78bc-00df-4f13-8dc9-0054ff0b1524.jpg',
        shopUrl: 'https://pl.aliexpress.com/item/1005010213859411.html'
      }
    ]
  },
  {
    id: 2,
    title: 'Znaleziska #1',
    tiktokUrl: 'https://www.tiktok.com/@polskaamazonka/video/7571815645281701142',
    previewImageUrl: 'https://placehold.co/160x220/0f172a/ffffff?text=TikTok',
    isActive: true,
    categoryIds: [1, 5],
    products: [
      {
        id: 3,
        name: 'Pies krajalnica',
        imageUrl: 'https://img.kwcdn.com/product/fancy/97f50a72-626f-48d8-aac2-7c5ae631fc51.jpg',
        shopUrl: 'https://allegro.pl/produkt/joie-doxie-dog-krajalnica'
      }
    ]
  }
];

export const MOCK_ADMIN_DISCOUNTS: AdminDiscountMock[] = [
  { id: 1, platform: 'ALIEXPRESS', codeValue: 'IFP9MDH', type: 'DISCOUNT', isActive: true },
  { id: 2, platform: 'TEMU', codeValue: 'apk84760', type: 'DISCOUNT', isActive: true }
];

export const MOCK_ADMIN_USERS: AdminUser[] = [
  { id: 1, login: 'admin', role: 'ADMIN' },
  { id: 2, login: 'worker1', role: 'WORKER' }
];
