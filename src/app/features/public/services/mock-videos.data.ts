import { Video } from '../models/video.model';

const PRODUCT_LINKS = {
  hooks: 'https://www.temu.com/pl/8-sztuk--regulowane-plastikowe-haczyki-na-kubki-oszcz%C4%99dzaj%C4%85ce-miejsce-rozszerzalne-stojaki-do-uk%C5%82adania-kubk%C3%B3w-do-kawy-i-herbaty-idealne-do-przechowywania-w-szafce-kuchennej-haczyki-w--casual-do-organizowania-kubk%C3%B3w-stojak-do-przechowywania-kubk%C3%B3w-g-601100659937349.html',
  drillBits: 'https://www.temu.com/pl/6-szt-uniwersalne-magnetyczne-wiert%C5%82a-do-%C5%9Brub-metalowe-magnetyczne-%C5%9Bruby-wymienny-klucz-p%C5%82aski-i-wiertarka-elektryczna-1-4-cala-6--pasuj%C4%85ce-do-wkr%C4%99tak%C3%B3w-phillips-d%C5%82ugie-wiert%C5%82a-g-601105023180435.html',
  faucetHead: 'https://www.temu.com/pl/kompaktowa-stalowa-kompaktowa-lataj%C4%85ca-ulewa-czterobiegowa-obrotowa-dysza-zmywanie-naczy%C5%84-domowy--wodospadowy-ma%C5%82a-bateria-prysznicowa-z-rowkiem-do-mycia-warzyw-niezb%C4%99dnik-do-u%C5%BCytku-domowego-g-601103574565059.html',
  coffeeTable: 'https://www.temu.com/pl/stolik-kawowy-z-podnoszonym--stolik-do-salonu-z-szufladami-ukrytymi-przegrodami-i-otwart%C4%85-p%C3%B3%C5%82k%C4%85-g-601101412727681.html',
  ledLights: 'https://www.temu.com/pl/3-lampki-akumulatorowe-lampki-nocne-2-szt-podw%C3%B3jna-g%C5%82owica-led-montowana-na-%C5%9Bcianie-z-czujnikiem-%C5%9Bciemnialne-3-kolory-ciep%C5%82a-biel-neutralna-zimna-biel-%C5%82adowanie-do-salonu-sypialni-korytarza-o%C5%9Bwietlenie-na-11-%C5%9Bwi%C4%85t-g-601103408935241.html'
};

export const MOCK_VIDEOS: Video[] = [
  {
    id: 101,
    title: 'TikTok #1 - topka',
    tiktokUrl: 'https://www.tiktok.com/@sars_m1/video/7617920310918106400',
    previewImageUrl: 'https://placehold.co/720x1280/2196f3/ffffff?text=TOPKA+1',
    isActive: true,
    createdAt: '2026-03-15T18:30:00.000Z',
    categoryIds: [1],
    products: [
      {
        id: 501,
        name: 'Regulowane haczyki na kubki',
        imageUrl: 'https://img.kwcdn.com/product/fancy/60f70492-8d28-4688-9cac-567e5e5a6724.jpg',
        productLink: { id: 9001, url: PRODUCT_LINKS.hooks, type: 'product' }
      }
    ]
  },
  {
    id: 102,
    title: 'TikTok #2 - temu',
    tiktokUrl: 'https://www.tiktok.com/@sars_m1/video/7617920712510147873',
    previewImageUrl: 'https://placehold.co/720x1280/ff9800/ffffff?text=TEMU+1',
    isActive: true,
    createdAt: '2026-03-14T15:10:00.000Z',
    categoryIds: [2],
    products: [
      {
        id: 502,
        name: 'Magnetyczne bity do śrub',
        imageUrl: 'https://img.kwcdn.com/product/fancy/f5a68220-4472-4fdf-b76b-722e947b6524.jpg',
        productLink: { id: 9002, url: PRODUCT_LINKS.drillBits, type: 'product' }
      },
      {
        id: 503,
        name: 'Obrotowa dysza do kranu',
        imageUrl: 'https://img.kwcdn.com/product/fancy/97f50a72-626f-48d8-aac2-7c5ae631fc51.jpg',
        productLink: { id: 9003, url: PRODUCT_LINKS.faucetHead, type: 'product' }
      }
    ]
  },
  {
    id: 103,
    title: 'TikTok #3 - topka',
    tiktokUrl: 'https://www.tiktok.com/@sars_m1/video/7617921149745335584',
    previewImageUrl: 'https://placehold.co/720x1280/2196f3/ffffff?text=TOPKA+2',
    isActive: true,
    createdAt: '2026-03-13T12:45:00.000Z',
    categoryIds: [1],
    products: [
      {
        id: 504,
        name: 'Stolik kawowy z podnoszonym blatem',
        imageUrl: 'https://img.kwcdn.com/product/fancy/2a3e78bc-00df-4f13-8dc9-0054ff0b1524.jpg',
        productLink: { id: 9004, url: PRODUCT_LINKS.coffeeTable, type: 'product' }
      }
    ]
  },
  {
    id: 104,
    title: 'TikTok #4 - temu',
    tiktokUrl: 'https://www.tiktok.com/@sars_m1/video/7617921944654056736',
    previewImageUrl: 'https://placehold.co/720x1280/ff9800/ffffff?text=TEMU+2',
    isActive: true,
    createdAt: '2026-03-12T20:00:00.000Z',
    categoryIds: [2],
    products: [
      {
        id: 505,
        name: 'Lampki akumulatorowe LED',
        imageUrl: 'https://img.kwcdn.com/product/fancy/7634f292-754c-47fa-84ae-b6ec3ce49b25.jpg',
        productLink: { id: 9005, url: PRODUCT_LINKS.ledLights, type: 'product' }
      }
    ]
  },
  {
    id: 105,
    title: 'TikTok #5 - topka + temu',
    tiktokUrl: 'https://www.tiktok.com/@sars_m1/video/7617922170529893664',
    previewImageUrl: 'https://placehold.co/720x1280/673ab7/ffffff?text=TOPKA%2BTEMU',
    isActive: true,
    createdAt: '2026-03-11T09:30:00.000Z',
    categoryIds: [1, 2],
    products: [
      {
        id: 506,
        name: 'Regulowane haczyki na kubki',
        imageUrl: 'https://img.kwcdn.com/product/fancy/60f70492-8d28-4688-9cac-567e5e5a6724.jpg',
        productLink: { id: 9006, url: PRODUCT_LINKS.hooks, type: 'product' }
      },
      {
        id: 507,
        name: 'Lampki akumulatorowe LED',
        imageUrl: 'https://img.kwcdn.com/product/fancy/7634f292-754c-47fa-84ae-b6ec3ce49b25.jpg',
        productLink: { id: 9007, url: PRODUCT_LINKS.ledLights, type: 'product' }
      }
    ]
  },
  {
    id: 106,
    title: 'TikTok #6 - topka',
    tiktokUrl: 'https://www.tiktok.com/@sars_m1/video/7617922651893386529',
    previewImageUrl: 'https://placehold.co/720x1280/2196f3/ffffff?text=TOPKA+3',
    isActive: true,
    createdAt: '2026-03-10T16:20:00.000Z',
    categoryIds: [1],
    products: [
      {
        id: 508,
        name: 'Magnetyczne bity do śrub',
        imageUrl: 'https://img.kwcdn.com/product/fancy/f5a68220-4472-4fdf-b76b-722e947b6524.jpg',
        productLink: { id: 9008, url: PRODUCT_LINKS.drillBits, type: 'product' }
      },
      {
        id: 509,
        name: 'Obrotowa dysza do kranu',
        imageUrl: 'https://img.kwcdn.com/product/fancy/97f50a72-626f-48d8-aac2-7c5ae631fc51.jpg',
        productLink: { id: 9009, url: PRODUCT_LINKS.faucetHead, type: 'product' }
      },
      {
        id: 510,
        name: 'Stolik kawowy z podnoszonym blatem',
        imageUrl: 'https://img.kwcdn.com/product/fancy/2a3e78bc-00df-4f13-8dc9-0054ff0b1524.jpg',
        productLink: { id: 9010, url: PRODUCT_LINKS.coffeeTable, type: 'product' }
      }
    ]
  },
  {
    id: 107,
    title: 'TikTok #7 - temu',
    tiktokUrl: 'https://www.tiktok.com/@sars_m1/video/7617923493534928161',
    previewImageUrl: 'https://placehold.co/720x1280/ff9800/ffffff?text=TEMU+3',
    isActive: true,
    createdAt: '2026-03-09T11:05:00.000Z',
    categoryIds: [2],
    products: [
      {
        id: 511,
        name: 'Lampki akumulatorowe LED',
        imageUrl: 'https://img.kwcdn.com/product/fancy/7634f292-754c-47fa-84ae-b6ec3ce49b25.jpg',
        productLink: { id: 9011, url: PRODUCT_LINKS.ledLights, type: 'product' }
      },
      {
        id: 512,
        name: 'Regulowane haczyki na kubki',
        imageUrl: 'https://img.kwcdn.com/product/fancy/60f70492-8d28-4688-9cac-567e5e5a6724.jpg',
        productLink: { id: 9012, url: PRODUCT_LINKS.hooks, type: 'product' }
      }
    ]
  },
  {
    id: 108,
    title: 'PA publiczny film #1',
    tiktokUrl: 'https://www.tiktok.com/@polskaamazonka/video/7566964823578266902',
    previewImageUrl: '',
    isActive: true,
    createdAt: '2026-03-16T10:00:00.000Z',
    categoryIds: [1],
    products: [
      {
        id: 513,
        name: 'Regulowane haczyki na kubki',
        imageUrl: 'https://img.kwcdn.com/product/fancy/60f70492-8d28-4688-9cac-567e5e5a6724.jpg',
        productLink: { id: 9013, url: PRODUCT_LINKS.hooks, type: 'product' }
      },
      {
        id: 514,
        name: 'Obrotowa dysza do kranu',
        imageUrl: 'https://img.kwcdn.com/product/fancy/97f50a72-626f-48d8-aac2-7c5ae631fc51.jpg',
        productLink: { id: 9014, url: PRODUCT_LINKS.faucetHead, type: 'product' }
      }
    ]
  },
  {
    id: 109,
    title: 'PA publiczny film #2',
    tiktokUrl: 'https://www.tiktok.com/@polskaamazonka/video/7551410528862702870',
    previewImageUrl: '',
    isActive: true,
    createdAt: '2026-03-16T09:30:00.000Z',
    categoryIds: [2],
    products: [
      {
        id: 515,
        name: 'Lampki akumulatorowe LED',
        imageUrl: 'https://img.kwcdn.com/product/fancy/7634f292-754c-47fa-84ae-b6ec3ce49b25.jpg',
        productLink: { id: 9015, url: PRODUCT_LINKS.ledLights, type: 'product' }
      }
    ]
  }
];
