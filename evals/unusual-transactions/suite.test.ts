import { describe, expect, it } from 'vitest';
import { APPROVAL_THRESHOLD, APPROVED_SUPPLIERS, generateCase, score } from './suite';

const cases = [1, 2, 3, 4, 5].map(generateCase);

describe('unusual-transactions cases', () => {
  it('are identical every time they are generated', () => {
    expect(generateCase(3)).toEqual(generateCase(3));
  });

  it.each(cases.map((c) => [c.id, c] as const))('%s: only planted rows break a rule', (_, c) => {
    const planted = new Set(c.planted.flatMap((p) => p.accept));
    const clean = c.rows.filter((r) => !planted.has(r.id));
    for (const r of clean) {
      expect(APPROVED_SUPPLIERS).toContain(r.supplier);
      expect(r.date.startsWith(c.month)).toBe(true);
      if (r.amount > APPROVAL_THRESHOLD) expect(r.approval_code).not.toBe('');
    }
    const sigs = clean.map((r) => `${r.supplier}|${r.amount}`);
    expect(new Set(sigs).size).toBe(sigs.length);
    expect(c.planted.length).toBeGreaterThanOrEqual(4);
    expect(c.planted.length).toBeLessThanOrEqual(6);
  });

  it('covers every problem type across the five cases', () => {
    expect(new Set(cases.flatMap((c) => c.planted.map((p) => p.type))).size).toBe(5);
  });
});

describe('scoring', () => {
  const c = cases[0];
  const perfect = JSON.stringify({ flags: c.planted.map((p) => ({ id: p.accept.at(-1), reason: p.type })) });

  it('gives 100 for finding everything with no false alarms', () => {
    expect(score(c, perfect).score).toBe(100);
  });

  it('accepts either row of a duplicate pair and tolerates code fences', () => {
    const answer = '```json\n' + JSON.stringify({ flags: c.planted.map((p) => ({ id: p.accept[0] })) }) + '\n```';
    expect(score(c, answer).found).toBe(c.planted.length);
  });

  it('counts false alarms and misses', () => {
    const clean = c.rows.find((r) => !c.planted.some((p) => p.accept.includes(r.id)))!;
    const s = score(c, JSON.stringify({ flags: [{ id: c.planted[0].accept[0] }, { id: clean.id }] }));
    expect(s.found).toBe(1);
    expect(s.false_alarms).toEqual([clean.id]);
    expect(s.score).toBeLessThan(50);
  });

  it('scores 0 when the answer is not in the required format', () => {
    expect(score(c, 'Here are the problems I found: EXP-1001').followed_format).toBe(false);
  });
});
