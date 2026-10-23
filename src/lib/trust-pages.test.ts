import { describe, expect, it } from 'vitest';
import { TRUST_PAGES, visibleTrustPages } from './trust-pages';

describe('approved trust pages', () => {
  it('exposes all four routes in production and preview', () => {
    expect(visibleTrustPages(true)).toEqual(TRUST_PAGES);
    expect(visibleTrustPages(false)).toEqual(TRUST_PAGES);
    expect(TRUST_PAGES.map((page) => page.slug)).toEqual([
      'about',
      'contact',
      'editorial-policy',
      'corrections',
    ]);
  });
});
