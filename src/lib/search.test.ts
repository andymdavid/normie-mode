import { describe, expect, it } from 'vitest';
import { graph } from './graph';
import { rank, type SearchEntry } from './search';
import { searchEntries } from './search-index';

// P0-003 verification: representative phrasings must resolve to one canonical task.
const CASES: [string, string][] = [
  ['analyse my spreadsheet', 'analyse-a-spreadsheet'],
  ['can chatgpt analyze excel', 'analyse-a-spreadsheet'],
  ['summarise a spreadsheet', 'analyse-a-spreadsheet'],
  ['ask questions about my sales data spreadsheet', 'analyse-a-spreadsheet'],
  ['fix ref errors', 'fix-a-broken-workbook'],
  ['why is my spreadsheet total wrong', 'fix-a-broken-workbook'],
  ['debug excel', 'fix-a-broken-workbook'],
  ['vlookup', 'write-a-formula'],
  ['excel formula generator', 'write-a-formula'],
  ['clean a messy csv', 'clean-up-messy-data'],
  ['remove duplicates', 'clean-up-messy-data'],
  ['bank reconciliation', 'reconcile-two-lists'],
  ['merge customer lists', 'reconcile-two-lists'],
  ['monthly management report', 'build-a-monthly-report'],
  ['budget vs actual', 'compare-budget-to-actuals'],
  ['variance analysis', 'compare-budget-to-actuals'],
  ['cash flow forecast', 'build-a-financial-model'],
  ['financial model', 'build-a-financial-model'],
  ['make graphs from spreadsheet', 'create-charts'],
  ['duplicate payments', 'spot-unusual-transactions'],
  ['expense outliers', 'spot-unusual-transactions'],
];

describe('intent search', () => {
  const entries: SearchEntry[] = searchEntries(graph());
  it.each(CASES)('"%s" resolves to %s', (query, task) => {
    expect(rank(entries, query)[0]?.url).toBe(`/tasks/${task}`);
  });
});
