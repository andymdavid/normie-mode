import { describe, expect, it } from 'vitest';
import { isTemporarilyNoindexedRoute, TEMPORARILY_NOINDEXED_MODEL_IDS } from './indexability';

describe('temporary indexability policy (D-035)', () => {
  it('excludes every child task but keeps parent task pages indexable', () => {
    expect(isTemporarilyNoindexedRoute('/best-ai-for/data-analysis')).toBe(true);
    expect(isTemporarilyNoindexedRoute('/best-ai-for/excel-spreadsheets')).toBe(false);
  });

  it('restores all nine enriched historical model pages under D-039', () => {
    expect(TEMPORARILY_NOINDEXED_MODEL_IDS.size).toBe(0);
    expect(isTemporarilyNoindexedRoute('/models/gpt-5-2')).toBe(false);
    expect(isTemporarilyNoindexedRoute('/models/gpt-5-6-luna')).toBe(false);
  });
});
