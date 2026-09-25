import { describe, expect, it } from 'vitest';
import { graph } from './graph';
import { NormMessageError, renderSlot, taskCostNote, taskEvidenceNote, taskFacts } from './norm';
import { lintNormText } from './rules';
import { allTaskPages, leadSentence, taskScores, topTwoTied } from './tasks';

const pages = allTaskPages().map((t) => [t.id, t] as const);
const clean = (s?: string) => {
  expect(s ?? '').not.toMatch(/\{|\}|undefined|NaN|Infinity/);
};

describe("Norm's data-driven messages", () => {
  it.each(pages)('%s: evidence note renders and names the chart leader', (_, task) => {
    const note = taskEvidenceNote(task);
    clean(note);
    const leader = taskScores(task).rows[0]?.label;
    if (leader) expect(note).toContain(leader);
  });

  it.each(pages)("%s: evidence note only mentions people's votes when the evidence is votes", (_, task) => {
    const f = taskFacts(task);
    const note = taskEvidenceNote(task) ?? '';
    if (/people's votes/.test(note) && !f.inherited) expect(f.votes_only || f.mostly_votes || f.half_votes).toBe(true);
    if (f.inherited) expect(note).toContain(String(f.hub));
  });

  it.each(pages)('%s: cost note matches the prices of the top-scoring models', (_, task) => {
    const note = taskCostNote(task);
    clean(note);
    const f = taskFacts(task);
    if (note && !f.leaders_similar_price) {
      expect(note).toContain(`${f.cheapest_leader} is the cheapest`);
      expect(note).toContain('models that score best for');
    }
  });

  it('fails loudly when a template needs a fact the page does not have', () => {
    expect(() => renderSlot('chart.tie', { first: 'A' })).toThrow(NormMessageError);
  });

  it('says the top two are too close to call, and lets price decide when it differs', () => {
    expect(renderSlot('chart.tie', { first: 'A', second: 'B', cost_differs: false })).toMatch(/^A and B are too close to call/);
    expect(renderSlot('chart.tie', { first: 'A', second: 'B', cost_differs: true, cheaper: 'B', dearer: 'A', price_ratio: 13 })).toContain('A costs about 13 times as much as B');
  });

  it("never says one model leads when Norm says it's a tie", () => {
    const rows = [
      { id: 'a', label: 'A', value: 1516, low: 1500, high: 1532 },
      { id: 'b', label: 'B', value: 1502, low: 1485, high: 1518 },
      { id: 'c', label: 'C', value: 1480, low: 1475, high: 1485 },
    ];
    expect(topTwoTied(rows)).toBeTruthy();
    expect(leadSentence(rows)).toBe('A and B are neck and neck at the top, followed by C.');
  });
});

describe("Norm's hand-written lines", () => {
  const g = graph();
  it('rejects data claims in an intro', () => {
    expect(lintNormText(g, 'These tests show Claude Fable 5.1 comes out on top.')).toEqual(
      expect.arrayContaining(['talks about tests', 'names "Claude Fable 5.1"', 'says who leads']),
    );
  });

  it('allows plain advice', () => {
    expect(lintNormText(g, 'Ask it to show its working, and check one number you already know.')).toEqual([]);
  });
});
