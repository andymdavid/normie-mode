import { describe, expect, it } from 'vitest';
import { latestRun, rankRun, type TestRun } from './normie-tests';

describe('rankRun', () => {
  it('ranks by answers right, then cost, then time', () => {
    const run = {
      summary: { models: [
        { model: 'a', name: 'A', cost_usd: 1.0, avg_seconds: 10 },
        { model: 'b', name: 'B', cost_usd: 0.2, avg_seconds: 50 },
        { model: 'c', name: 'C', cost_usd: 0.01, avg_seconds: 5 },
      ] },
      answers: [
        { model: 'a', score: { correct: 6, total: 6 } },
        { model: 'b', score: { correct: 6, total: 6 } },
        { model: 'c', score: { correct: 5, total: 6 } },
      ],
    } as unknown as TestRun;
    const r = rankRun(run);
    expect(r.map((x) => x.model)).toEqual(['b', 'a', 'c']);
    expect(r[0].why).toBe('All 6 right, cheapest of those');
    expect(r[2].why).toBe('5 of 6 right');
  });

  it('picks a best overall from the committed pilot run', () => {
    const run = latestRun('spreadsheet-questions');
    expect(run && rankRun(run)[0].correct).toBe(run && rankRun(run)[0].total);
  });
});
