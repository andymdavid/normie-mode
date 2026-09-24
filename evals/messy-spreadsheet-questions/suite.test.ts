import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildPrompt, generateCase, isoDate, mockAnswer, score, type Case } from './suite';

const cases: Case[] = [1, 2, 3, 4, 5].map((n) =>
  JSON.parse(readFileSync(`evals/messy-spreadsheet-questions/cases/case-0${n}.json`, 'utf8')),
);

// Independent recalculation, written separately from the suite's own answer key.
function recompute(c: Case) {
  const seen = new Set<string>();
  const rows = c.rows.filter((r) => !seen.has(r.order_id) && seen.add(r.order_id));
  const done = rows.filter((r) => r.status === 'Completed');
  const val = (r: Case['rows'][number]) => (r.quantity * r.unit_price * (100 - r.discount_pct)) / 100;
  const month = (r: Case['rows'][number]) => Number(isoDate(r.date).slice(5, 7));
  const who = (n: string) => c.aliases[n] ?? n;
  const cust = new Map<string, number>();
  for (const r of done) cust.set(who(r.customer), (cust.get(who(r.customer)) ?? 0) + val(r));
  return {
    march: done.filter((r) => month(r) === 3).reduce((s, r) => s + val(r), 0),
    top: [...cust].sort((a, b) => b[1] - a[1])[0],
    returns: -done.filter((r) => r.quantity < 0).reduce((s, r) => s + val(r), 0),
    duplicates: c.rows.length - rows.length,
  };
}

describe('messy-spreadsheet-questions cases', () => {
  it('match what the generator produces', () => {
    expect(generateCase(2)).toEqual(cases[1]);
  });

  it.each(cases.map((c) => [c.id, c] as const))('%s: answer key checks out and the mess is there', (_, c) => {
    const q = Object.fromEntries(c.questions.map((x) => [x.id, x.expected]));
    const r = recompute(c);
    expect(q.q1.value).toBeCloseTo(r.march, 1);
    expect(q.q2.name).toBe(r.top[0]);
    expect(q.q2.value).toBeCloseTo(r.top[1], 1);
    expect(q.q6.value).toBeCloseTo(r.returns, 1);
    expect(q.q7.value).toBe(r.duplicates);
    expect(c.rows.some((x) => x.date.includes('/'))).toBe(true);
    expect(c.rows.some((x) => x.quantity < 0)).toBe(true);
    expect(c.rows.some((x) => x.customer in c.aliases && c.aliases[x.customer] !== x.customer)).toBe(true);
  });

  it('makes the lazy reading give the wrong biggest customer', () => {
    for (const c of cases) {
      const lazy = new Map<string, number>();
      for (const r of c.rows.filter((x) => x.status === 'Completed')) lazy.set(r.customer, (lazy.get(r.customer) ?? 0) + (r.quantity * r.unit_price * (100 - r.discount_pct)) / 100);
      const [name, amount] = [...lazy].sort((a, b) => b[1] - a[1])[0];
      const q2 = c.questions.find((q) => q.id === 'q2')!.expected;
      expect(name !== q2.name || Math.abs(amount - q2.value) > q2.value * 0.005).toBe(true);
    }
  });

  it('keeps duplicate rows identical to the original', () => {
    for (const c of cases) {
      const first = new Map<string, string>();
      for (const row of c.rows) {
        const key = JSON.stringify(row);
        if (first.has(row.order_id)) expect(key).toBe(first.get(row.order_id));
        else first.set(row.order_id, key);
      }
    }
  });

  it('keeps prompts a manageable size', () => {
    for (const c of cases) expect(buildPrompt(c).length).toBeLessThan(22000);
  });
});

describe('scoring', () => {
  const c = cases[0];
  it('counts the mock answer as 7 of 8', () => {
    expect(score(c, mockAnswer(c)).correct).toBe(7);
  });

  it('accepts any spelling of the right customer', () => {
    const variant = Object.keys(c.aliases).find((a) => c.aliases[a] === c.questions[1].expected.name);
    const answers = JSON.parse(mockAnswer(c)).answers;
    answers.q2 = { name: variant ?? c.questions[1].expected.name!.toUpperCase(), amount: c.questions[1].expected.value };
    expect(score(c, JSON.stringify({ answers })).per_question.q2).toBe(true);
  });

  it('marks a wrong count wrong', () => {
    const answers = JSON.parse(mockAnswer(c)).answers;
    answers.q7 += 1;
    expect(score(c, JSON.stringify({ answers })).per_question.q7).toBe(false);
  });
});
