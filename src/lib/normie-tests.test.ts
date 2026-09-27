import { describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { publishedRun, rankRun, type TestRun } from './normie-tests';

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
    const run = publishedRun('spreadsheet-questions');
    expect(run && rankRun(run)[0].correct).toBe(run && rankRun(run)[0].total);
  });
});

describe('publishedRun', () => {
  // Three runs of a toy suite: v1 with A and B, a v1 run that adds C and re-runs A, then nothing else.
  const base = mkdtempSync(join(tmpdir(), 'normie-runs-'));
  const suite = 'toy';
  mkdirSync(join(base, suite, 'cases'), { recursive: true });
  writeFileSync(join(base, suite, 'cases', 'case-01.json'), JSON.stringify({ id: 'case-01', questions: [] }));
  const save = (runId: string, version: string, models: [string, number][], mock = false) => {
    const dir = join(base, suite, 'results', runId);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'summary.json'), JSON.stringify({ suite, version, run_id: runId, mock, cases: ['case-01'], total_cost_usd: 0, models: models.map(([model, correct]) => ({ model, name: model.toUpperCase(), score: null, cost_usd: 0.1, avg_seconds: 1, format_failures: 0, errors: 0 })) }));
    for (const [model, correct] of models) writeFileSync(join(dir, `${model}__case-01__r1.json`), JSON.stringify({ model, case: 'case-01', run: 1, score: { correct, total: 6 } }));
  };
  save('2026-09-24-09-00', '1', [['a', 4], ['b', 5]]);
  save('2026-09-28-10-00', '1', [['a', 6], ['c', 3]]);
  save('2026-09-29-10-00-mock', '1', [['a', 0]], true);

  it('keeps models from earlier runs when a later run only adds some', () => {
    const run = publishedRun(suite, base)!;
    expect(run.summary.models.map((m) => m.model).sort()).toEqual(['a', 'b', 'c']);
    expect(run.runIds).toEqual(['2026-09-24-09-00', '2026-09-28-10-00']);
  });

  it("uses each model's most recent answers and ignores mock runs", () => {
    const run = publishedRun(suite, base)!;
    expect(run.answers.filter((a) => a.model === 'a').map((a) => a.score.correct)).toEqual([6]);
    expect(run.answers.filter((a) => a.model === 'b').map((a) => a.score.correct)).toEqual([5]);
  });

  it('starts afresh when the suite version changes', () => {
    save('2026-10-01-10-00', '2', [['d', 6]]);
    expect(publishedRun(suite, base)!.summary.models.map((m) => m.model)).toEqual(['d']);
  });
});
