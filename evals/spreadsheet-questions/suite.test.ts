import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildPrompt, generateCase, mockAnswer, score, type Case } from './suite';

const cases: Case[] = [1, 2, 3, 4, 5].map((n) =>
  JSON.parse(readFileSync(`evals/spreadsheet-questions/cases/case-0${n}.json`, 'utf8')),
);

// Independent recalculation (not using the suite's helpers) so a bug in the answer key shows up.
const value = (o: Case['orders'][number]) => (o.quantity * o.unit_price * (100 - o.discount_pct)) / 100;
const completed = (c: Case) => c.orders.filter((o) => o.status === 'Completed');

describe('spreadsheet-questions cases', () => {
  it('match what the generator produces', () => {
    expect(generateCase(1)).toEqual(cases[0]);
  });

  it.each(cases.map((c) => [c.id, c] as const))('%s: answer key checks out', (_, c) => {
    const q = Object.fromEntries(c.questions.map((x) => [x.id, x.expected]));
    const march = completed(c).filter((o) => o.date.startsWith('2026-03')).reduce((s, o) => s + value(o), 0);
    expect(q.q1.value).toBeCloseTo(march, 1);
    const lost = c.orders.filter((o) => o.status !== 'Completed').reduce((s, o) => s + value(o), 0);
    expect(q.q4.value).toBeCloseTo(lost, 1);
    const byCustomer = new Map<string, number>();
    for (const o of completed(c)) byCustomer.set(o.customer, (byCustomer.get(o.customer) ?? 0) + value(o));
    const top = [...byCustomer].sort((a, b) => b[1] - a[1])[0];
    expect(q.q5).toMatchObject({ name: top[0] });
    expect(q.q5.value).toBeCloseTo(top[1], 1);
    // The data includes the things the questions test for.
    expect(c.orders.some((o) => o.status === 'Refunded')).toBe(true);
    expect(c.orders.some((o) => o.status === 'Cancelled')).toBe(true);
    expect(c.orders.some((o) => o.discount_pct > 0)).toBe(true);
  });

  it('keeps prompts small', () => {
    for (const c of cases) expect(buildPrompt(c).length).toBeLessThan(16000);
  });
});

describe('scoring', () => {
  const c = cases[0];
  const perfect = JSON.stringify({
    answers: Object.fromEntries(
      c.questions.map((q) => [
        q.id,
        q.kind === 'money' ? q.expected.value : q.kind === 'name' ? q.expected.name : q.kind === 'name+percent' ? { name: q.expected.name, percent: q.expected.value } : { name: q.expected.name, amount: q.expected.value },
      ]),
    ),
  });

  it('gives 100 for all correct answers', () => {
    expect(score(c, perfect).score).toBe(100);
  });

  it('allows rounding, currency symbols and different name case', () => {
    const answers = JSON.parse(perfect).answers;
    answers.q1 = `£${(c.questions[0].expected.value! + 0.4).toLocaleString('en-GB')}`;
    answers.q2 = answers.q2.toUpperCase();
    expect(score(c, JSON.stringify({ answers })).correct).toBe(6);
  });

  it('marks a wrong number wrong', () => {
    const answers = JSON.parse(perfect).answers;
    answers.q1 = c.questions[0].expected.value! * 1.05;
    expect(score(c, JSON.stringify({ answers })).per_question.q1).toBe(false);
  });

  it('counts the mock answer as 5 of 6', () => {
    expect(score(c, mockAnswer(c)).correct).toBe(5);
  });

  it('reads the final answers after any working', () => {
    expect(score(c, `Working: March orders {SO-2050, ...} sum to...\n\nFinal:\n${perfect}`).score).toBe(100);
  });

  it('scores 0 when the answer is not JSON', () => {
    expect(score(c, 'March revenue was about £40k').followed_format).toBe(false);
  });
});
