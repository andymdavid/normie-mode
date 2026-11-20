import { afterEach, describe, expect, it, vi } from 'vitest';
import { graph } from './graph';
import { NormMessageError, renderSlot, taskCostNote, taskEvidenceNote, taskFacts } from './norm';
import { lintNormText } from './rules';
import { allTaskPages, leadSentence, taskScores, topTwoTied } from './tasks';
import * as taskData from './tasks';

const pages = allTaskPages().map((t) => [t.id, t] as const);
afterEach(() => vi.restoreAllMocks());
const clean = (s?: string) => expect(s ?? '').not.toMatch(/\{|\}|undefined|NaN|Infinity/);

describe("Norm's data-driven messages", () => {
  // One page contract reuses facts/messages instead of recalculating them in four cases.
  // Every task page is still checked, with its ID in the failure name.
  it.each(pages)('%s: messages agree with the page evidence and prices', (_, task) => {
    const evidence = taskEvidenceNote(task);
    const cost = taskCostNote(task);
    const facts = taskFacts(task);
    clean(evidence);
    clean(cost);
    const leader = taskScores(task).rows[0]?.label;
    if (leader) expect(evidence).toContain(leader);
    if (/people's votes/.test(evidence ?? '') && !facts.inherited)
      expect(facts.votes_only || facts.mostly_votes || facts.half_votes).toBe(true);
    if (facts.inherited) expect(evidence).toContain(String(facts.hub));
    if (cost && !facts.leaders_similar_price) {
      expect(cost).toContain(`${facts.cheapest_leader} is the cheapest`);
      expect(cost).toContain('models that score best for');
    }
  });

  it('counts visible direct and related evidence without counting a sparse test', () => {
    const task = graph().intents.get('excel-spreadsheets')!;
    const tests = ['spreadsheet-questions', 'dtbench', 'gpqa-diamond'].map(id => graph().tests.get(id)!);
    vi.spyOn(taskData, 'scoringTests').mockReturnValue(tests);
    vi.spyOn(taskData, 'effectiveTests').mockReturnValue([
      {test:'spreadsheet-questions',closeness:'direct'},
      {test:'dtbench',closeness:'related'},
      {test:'gpqa-diamond',closeness:'direct'},
    ]);
    vi.spyOn(taskData, 'testRows').mockImplementation(test =>
      ['a','b','c'].slice(0,test.id === 'gpqa-diamond' ? 2 : 3)
        .map(id => ({id,label:id,value:50})),
    );
    vi.spyOn(taskData, 'taskScores').mockReturnValue({rows:[],testsUsed:2,closeness:'direct'});
    expect(taskFacts(task)).toMatchObject({
      direct_words:'one test', related_words:'one test', direct_verb:'measures',
      related_clause:', and one test covers related skills',
    });
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
    expect(leadSentence([
      { id: 'a', label: 'A', value: 100 },
      { id: 'b', label: 'B', value: 100 },
      { id: 'c', label: 'C', value: 100 },
      { id: 'd', label: 'D', value: 90 },
    ])).toBe('A, B and C are level at the top.');
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
