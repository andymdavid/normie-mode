import { describe, expect, it } from 'vitest';
import { loadGraph, type Graph } from './graph';
import { confidenceCeiling, relevance, reviewFlags, validate } from './rules';
import type { Recommendation, Result } from './schema';

/** Fresh copy of the real content graph, so each test can mutate it. */
function fixture(): Graph {
  return loadGraph();
}

function addResult(g: Graph, r: Partial<Result> & Pick<Result, 'id' | 'model_version' | 'source'>): Result {
  const full: Result = {
    benchmark: 'aa-analyst-agent',
    benchmark_version: 'current',
    metric: 'pass-5',
    value: 50,
    published_on: '2026-09-01',
    configuration: {},
    ...r,
  };
  g.results.set(full.id, full);
  return full;
}

const rec = (over: Partial<Recommendation>): Recommendation => ({
  id: 'test-rec',
  task: 'analyse-a-spreadsheet',
  scope: 'best-overall',
  model_version: 'claude-opus-5',
  confidence: 'limited',
  status: 'draft',
  verdict: 'test',
  rationale: [{ text: 'x', basis: 'editorial', results: [], sources: [] }],
  limitations: [],
  evidence: [],
  alternatives: [],
  reviewed_on: '2026-09-23',
  reviewer: 'unreviewed',
  ...over,
});

describe('relevance', () => {
  it('treats a benchmark subset linked to a task as direct and other subsets as proxy', () => {
    const g = fixture();
    expect(relevance(g, { benchmark: 'spreadsheetbench-2', subset: 'debugging' }, 'fix-a-broken-workbook')).toBe('direct');
    expect(relevance(g, { benchmark: 'spreadsheetbench-2', subset: 'template' }, 'fix-a-broken-workbook')).toBe('proxy');
  });
});

describe('confidenceCeiling', () => {
  it('allows only moderate from a single direct source', () => {
    const g = fixture();
    expect(confidenceCeiling(g, rec({ evidence: ['aa-analyst-claude-opus-5'] })).ceiling).toBe('moderate');
  });

  it('allows strong with two direct sources including an independent one', () => {
    const g = fixture();
    addResult(g, { id: 'extra', model_version: 'claude-opus-5', source: 'kimi-k3-github' });
    expect(confidenceCeiling(g, rec({ evidence: ['aa-analyst-claude-opus-5', 'extra'] })).ceiling).toBe('strong');
  });

  it('caps predecessor-only evidence at limited', () => {
    const g = fixture();
    const c = confidenceCeiling(g, rec({ task: 'fix-a-broken-workbook', evidence: ['sb2-paper-claude-opus-4-6-debugging'] }));
    expect(c.ceiling).toBe('limited');
    expect(c.usesPredecessorEvidence).toBe(true);
  });

  it('returns insufficient without a model', () => {
    const g = fixture();
    expect(confidenceCeiling(g, rec({ model_version: undefined })).ceiling).toBe('insufficient');
  });
});

describe('validate', () => {
  it('passes on the committed content', () => {
    expect(validate(fixture(), '2026-09-23').errors).toEqual([]);
  });

  it('rejects confidence above the evidence ceiling', () => {
    const g = fixture();
    g.recommendations.set('test-rec', rec({ confidence: 'strong', evidence: ['aa-analyst-claude-opus-5'] }));
    expect(validate(g).errors.join('\n')).toMatch(/exceeds what the evidence supports/);
  });

  it('refuses to publish an unreviewed or unverified recommendation', () => {
    const g = fixture();
    g.recommendations.set('test-rec', rec({ status: 'published', model_version: 'gemini-3-7-flash', evidence: ['aa-analyst-gemini-3-7-flash'] }));
    const errors = validate(g).errors.join('\n');
    expect(errors).toMatch(/named human reviewer/);
    expect(errors).toMatch(/unverified/);
    expect(errors).toMatch(/must state limitations/);
  });

  it('requires measured claims to cite results', () => {
    const g = fixture();
    g.recommendations.set('test-rec', rec({ rationale: [{ text: 'fast', basis: 'measured', results: [], sources: [] }] }));
    expect(validate(g).errors.join('\n')).toMatch(/measured claim needs results/);
  });
});

describe('reviewFlags', () => {
  it('flags new evidence published after review and stale reviews', () => {
    const g = fixture();
    g.recommendations.set('test-rec', rec({ reviewed_on: '2026-01-01', evidence: ['aa-analyst-claude-opus-5'] }));
    const reasons = reviewFlags(g, '2026-09-23')
      .filter((f) => f.recommendation === 'test-rec')
      .map((f) => f.reason)
      .join('\n');
    expect(reasons).toMatch(/new result\(s\) published after review/);
    expect(reasons).toMatch(/Last reviewed \d+ days ago/);
  });

  it('flags a cited result that has been superseded', () => {
    const g = fixture();
    g.recommendations.set('test-rec', rec({ evidence: ['aa-analyst-claude-opus-5'] }));
    addResult(g, { id: 'correction', model_version: 'claude-opus-5', source: 'aa-analyst-agent', supersedes: 'aa-analyst-claude-opus-5' });
    expect(reviewFlags(g, '2026-09-23').map((f) => f.reason)).toContain('Cited result aa-analyst-claude-opus-5 has been superseded.');
  });
});
