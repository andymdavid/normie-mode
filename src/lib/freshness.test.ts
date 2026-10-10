import { describe, expect, it } from 'vitest';
import { routeLastmod } from './freshness';

describe('route freshness', () => {
  it.each([
    '/',
    '/best-ai-for/excel-spreadsheets',
    '/models/claude-opus-5-5',
    '/benchmarks/arena-overall',
    '/tests/spreadsheet-questions',
  ])('returns a stable ISO date for %s', (route) => {
    const first = routeLastmod(route);
    expect(first).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(routeLastmod(route)).toBe(first);
  });
});
