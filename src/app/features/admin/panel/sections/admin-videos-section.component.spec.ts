import { resolveProductLinkVisualStatus } from './admin-videos-section.component';

describe('resolveProductLinkVisualStatus', () => {
  const url = 'https://allegro.pl/oferta/produkt-123';

  it('returns invalid for a broken link', () => {
    expect(resolveProductLinkVisualStatus({ shopUrl: url, isBroken: true, needsReview: false })).toBe('invalid');
  });

  it('gives broken status priority over review', () => {
    expect(resolveProductLinkVisualStatus({ shopUrl: url, isBroken: true, needsReview: true })).toBe('invalid');
  });

  it('returns invalid for a missing URL', () => {
    expect(resolveProductLinkVisualStatus({ shopUrl: '   ', isBroken: false, needsReview: false })).toBe('invalid');
    expect(resolveProductLinkVisualStatus({ shopUrl: '#', isBroken: null, needsReview: false })).toBe('invalid');
  });

  it('returns review for a link requiring review or without a confirmed result', () => {
    expect(resolveProductLinkVisualStatus({ shopUrl: url, isBroken: false, needsReview: true })).toBe('review');
    expect(resolveProductLinkVisualStatus({ shopUrl: url, isBroken: null, needsReview: false })).toBe('review');
  });

  it('returns valid only for a confirmed working link', () => {
    expect(resolveProductLinkVisualStatus({ shopUrl: url, isBroken: false, needsReview: false })).toBe('valid');
  });
});
