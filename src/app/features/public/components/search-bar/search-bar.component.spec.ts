import { fakeAsync, tick } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { SearchBarComponent } from './search-bar.component';
import { PublicSearchProduct } from '../../services/public-product-search.service';

describe('SearchBarComponent', () => {
  const product: PublicSearchProduct = { id: 1, name: 'Gąbka', imageUrl: null };

  function createComponent(search: jasmine.Spy) {
    return new SearchBarComponent(
      { search } as any,
      { resolveProductImageUrl: (value: string | null) => value ?? '' } as any,
      { recordClick: jasmine.createSpy('recordClick') } as any
    );
  }

  it('keeps the input stream active after an HTTP error and clears the error after success', fakeAsync(() => {
    const search = jasmine.createSpy('search').and.returnValues(
      throwError(() => new Error('offline')),
      of([product])
    );
    const component = createComponent(search);
    component.ngOnInit();

    component.searchControl.setValue('pierwsza');
    tick(300);

    expect(search).toHaveBeenCalledWith('pierwsza');
    expect(component.searchError).toBe('Nie udało się pobrać wyników wyszukiwania. Spróbuj ponownie.');
    expect(component.isSearching).toBeFalse();
    expect(component.searchResults).toEqual([]);

    component.searchControl.setValue('druga');
    tick(300);

    expect(search).toHaveBeenCalledWith('druga');
    expect(component.searchResults).toEqual([product]);
    expect(component.searchError).toBeNull();
    expect(component.isSearching).toBeFalse();
    component.ngOnDestroy();
  }));

  it('does not let a cancelled older request overwrite newer results', fakeAsync(() => {
    const olderRequest = new Subject<PublicSearchProduct[]>();
    const search = jasmine.createSpy('search').and.returnValues(olderRequest, of([product]));
    const component = createComponent(search);
    component.ngOnInit();

    component.searchControl.setValue('starsza');
    tick(300);
    component.searchControl.setValue('nowsza');
    tick(300);
    olderRequest.next([{ id: 2, name: 'Stary wynik', imageUrl: null }]);

    expect(component.searchResults).toEqual([product]);
    expect(component.searchError).toBeNull();
    component.ngOnDestroy();
  }));
});
