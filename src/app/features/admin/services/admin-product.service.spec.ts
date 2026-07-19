import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AdminProductService } from './admin-product.service';

describe('AdminProductService', () => {
  let service: AdminProductService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AdminProductService,
        { provide: 'BACKEND_URL', useValue: 'http://backend.test' }
      ]
    });
    service = TestBed.inject(AdminProductService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('searches the limited administrative list for the current video', () => {
    service.search('gąbka', 16).subscribe((results) => expect(results.length).toBe(1));

    const request = http.expectOne((candidate) =>
      candidate.url === 'http://backend.test/api/admin/products/search'
      && candidate.params.get('query') === 'gąbka'
      && candidate.params.get('videoId') === '16'
      && candidate.params.get('page') === '0'
      && candidate.params.get('limit') === '25'
    );
    expect(request.request.method).toBe('GET');
    request.flush([{ productId: 20 }]);
  });

  it('requests the next page and allows an empty default query', () => {
    service.search('', 16, 1).subscribe();

    const request = http.expectOne((candidate) =>
      candidate.url === 'http://backend.test/api/admin/products/search'
      && candidate.params.get('query') === ''
      && candidate.params.get('videoId') === '16'
      && candidate.params.get('page') === '1'
      && candidate.params.get('limit') === '25'
    );
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });

  it('attaches an existing product without a promoCode payload', () => {
    service.attach(16, 20).subscribe();

    const request = http.expectOne('http://backend.test/api/videos/16/products/20/attach');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({});
    request.flush({});
  });
});
