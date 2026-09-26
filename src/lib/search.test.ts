import { describe, expect, it } from 'vitest';
import { rank } from './search';
import { searchEntries } from './search-index';

// Everyday phrasings must land on the task page that answers them (N-012).
const CASES: [string, string][] = [
  ['excel', '/best-ai-for/excel-spreadsheets'],
  ['analyse my spreadsheet', '/best-ai-for/excel-spreadsheets'],
  ['google sheets', '/best-ai-for/excel-spreadsheets'],
  ['vibe coding', '/best-ai-for/vibe-coding'],
  ['coding', '/best-ai-for/coding'],
  ['write my cv', '/best-ai-for/resume-writing'],
  ['essay', '/best-ai-for/essay-writing'],
  ['homework', '/best-ai-for/homework'],
  ['travel planning', '/best-ai-for/travel-planning'],
  ['translation', '/best-ai-for/translation-languages'],
  ['legal', '/best-ai-for/legal'],
  ['claude', '/models/'],
];

describe('task search', () => {
  const entries = searchEntries();
  it.each(CASES)('"%s" resolves to %s', (query, url) => {
    expect(rank(entries, query)[0]?.url.startsWith(url), `got ${rank(entries, query)[0]?.url}`).toBe(true);
  });
});
