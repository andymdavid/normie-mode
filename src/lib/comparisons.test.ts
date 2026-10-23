import { describe, expect, it } from 'vitest';
import { COMPARISONS, comparisonData, comparisonsForModel, isDraftComparisonRoute, visibleComparisons } from './comparisons';

describe('curated model comparisons', () => {
  it('keeps draft comparisons out of production and exposes them in preview', () => {
    expect(COMPARISONS).toHaveLength(1);
    expect(visibleComparisons(false)).toEqual([]);
    expect(visibleComparisons(true)).toEqual(COMPARISONS);
    expect(comparisonsForModel('claude-opus-5-5', false)).toEqual([]);
    expect(comparisonsForModel('claude-opus-5-5', true)).toEqual(COMPARISONS);
    expect(comparisonsForModel('gpt-6-sol', true)).toEqual([]);
    expect(isDraftComparisonRoute('/compare/claude-opus-5-5-vs-gemini-3-8-flash')).toBe(true);
    expect(isDraftComparisonRoute('/compare/arbitrary-pair')).toBe(false);
  });

  it('derives shared task and test facts from canonical model data', () => {
    const comparison = comparisonData(COMPARISONS[0]);

    expect(comparison.models.map((model) => model.name)).toEqual(['Claude Opus 5.5', 'Gemini 3.8 Flash']);
    expect(comparison.tasks.length).toBeGreaterThanOrEqual(3);
    expect(comparison.tests.length).toBeGreaterThanOrEqual(5);
    expect(comparison.answer).toContain(`${comparison.tasks.length} tasks where both exact versions can be scored`);
    expect(comparison.answer).toContain('overall winner');
    expect(comparison.coverage.every((coverage) => coverage.tasks >= comparison.tasks.length)).toBe(true);
    expect(comparison.tasks.every((task) => task.scores.every(Number.isFinite))).toBe(true);
  });
});
