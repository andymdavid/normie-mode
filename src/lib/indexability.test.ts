import { describe, expect, it } from 'vitest';
import { isTemporarilyNoindexedRoute, TEMPORARILY_NOINDEXED_MODEL_IDS } from './indexability';

describe('temporary indexability policy (D-035)', () => {
  it('excludes every child task but keeps parent task pages indexable', () => {
    expect(isTemporarilyNoindexedRoute('/best-ai-for/data-analysis')).toBe(true);
    expect(isTemporarilyNoindexedRoute('/best-ai-for/excel-spreadsheets')).toBe(false);
  });

  it('excludes exactly the nine approved historical model pages', () => {
    expect(TEMPORARILY_NOINDEXED_MODEL_IDS.size).toBe(9);
    expect(isTemporarilyNoindexedRoute('/models/gpt-5-2')).toBe(true);
    expect(isTemporarilyNoindexedRoute('/models/gpt-5-6-luna')).toBe(false);
  });
});
