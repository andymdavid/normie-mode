import { describe, expect, it } from 'vitest';
import { TRUST_PAGES, visibleTrustPages } from './trust-pages';

describe('draft trust pages', () => {
  it('exposes all four routes in preview only', () => {
    expect(visibleTrustPages(true)).toEqual(TRUST_PAGES);
    expect(visibleTrustPages(false)).toEqual([]);
    expect(TRUST_PAGES.map((page) => page.slug)).toEqual([
      'about',
      'contact',
      'editorial-policy',
      'corrections',
    ]);
  });
});
