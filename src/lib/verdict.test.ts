import { describe, expect, it } from 'vitest';
import { cachedTaskScores, scoredOnVotesOnly } from './models';
import { allTaskPages } from './tasks';
import { STANDARD_PLAN_MAX_USD, TOO_CLOSE_POINTS, verdict } from './verdict';

// D-027: the verdict is worked out from the same task score as the chart beneath it.
describe('task page verdicts (D-027)', () => {
  const pages = allTaskPages().map((task) => ({ task, v: verdict(task), rows: cachedTaskScores(task).rows }));

  it('gives every task page with a task score a verdict', () => {
    for (const { task, v, rows } of pages) if (rows.length) expect(v, task.id).toBeDefined();
  });

  for (const { task, v, rows } of pages) {
    if (!v) continue;
    describe(task.id, () => {
      const byKind = (k: string) => v.picks.find((p) => p.kinds.includes(k as never));

      it('names the top of the task score as best overall', () => {
        expect(byKind('best')!.options.map((o) => o.modelId)).toContain(rows[0].id);
      });

      it('keeps each pick within its budget', () => {
        for (const o of byKind('standard')?.options ?? []) expect(o.plan!.plan.price_usd).toBeLessThanOrEqual(STANDARD_PLAN_MAX_USD);
        for (const o of byKind('free')?.options ?? []) expect(o.plan!.plan.price_usd).toBe(0);
      });

      it('never counts a model that costs extra as included', () => {
        for (const p of v.picks) for (const o of p.options) if (o.plan) expect(o.plan.entry.access).not.toBe('extra-cost');
      });

      it('only names two models when they are too close to call', () => {
        for (const p of v.picks) {
          if (p.options.length === 2) expect(Math.abs(p.options[0].score - p.options[1].score)).toBeLessThan(TOO_CLOSE_POINTS);
        }
      });

      it('matches positions and scores to the chart', () => {
        for (const p of v.picks) {
          for (const o of p.options) {
            expect(rows[o.position - 1].id).toBe(o.modelId);
            expect(rows[o.position - 1].value).toBe(o.score);
          }
        }
      });

      it("never picks a model scored on people's votes alone when the task has tests of real work (D-029)", () => {
        for (const p of v.picks) for (const o of p.options) expect(scoredOnVotesOnly(task, o.modelId)).toBe(false);
      });

      it('shows each pick once', () => {
        const keys = v.picks.map((p) => p.options.map((o) => o.modelId).join());
        expect(new Set(keys).size).toBe(keys.length);
      });
    });
  }
});
