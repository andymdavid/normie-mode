import { describe, expect, it } from 'vitest';
import { historicalModelEvidence } from './models';
describe('archived mutable API aliases', () => {
  it('keeps the September exact version specs and their original retrieval date', () => {
    const old = historicalModelEvidence('deepseek-v4-1-flash');
    const next = historicalModelEvidence('deepseek-v4-1-flash-1017');
    expect(old.spec?.model).toBe('deepseek-v4-1-flash');
    expect(old.spec?.archived_retrieved_at).toBeTruthy();
    expect(old.sources.modelsdev?.retrieved_at).toBe(old.spec?.archived_retrieved_at);
    expect(next.spec?.model).toBe('deepseek-v4-1-flash-1017');
    expect(next.sources.modelsdev?.retrieved_at).not.toBe(old.sources.modelsdev?.retrieved_at);
  });
});
