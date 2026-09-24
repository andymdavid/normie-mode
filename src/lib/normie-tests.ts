// Reads Normie Mode test runs (evals/<suite>/results/<run>/) for the site. Draft-only until
// the product owner signs a run off (AGENTS.md: results need review before publication).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseAnswers, type Case, type Question } from '../../evals/spreadsheet-questions/suite';

export interface AnswerRecord {
  model: string;
  case: string;
  run: number;
  seconds: number;
  cost: number;
  text: string;
  error?: string;
  score: { correct: number; total: number; score: number; per_question: Record<string, boolean>; followed_format: boolean };
}

export interface RunSummary {
  suite: string;
  run_id: string;
  total_cost_usd: number;
  cases: string[];
  models: { model: string; name: string; score: number | null; cost_usd: number; avg_seconds: number | null; format_failures: number; errors: number }[];
}

export interface TestRun {
  summary: RunSummary;
  cases: Case[];
  answers: AnswerRecord[];
}

const root = (suite: string) => join(process.cwd(), 'evals', suite);

/** Latest real (non-mock) run of a suite, with its cases and every saved answer. */
export function latestRun(suite: string): TestRun | undefined {
  const dir = join(root(suite), 'results');
  if (!existsSync(dir)) return undefined;
  const runId = readdirSync(dir).filter((d) => !d.endsWith('-mock') && existsSync(join(dir, d, 'summary.json'))).sort().at(-1);
  if (!runId) return undefined;
  const runDir = join(dir, runId);
  const summary: RunSummary = JSON.parse(readFileSync(join(runDir, 'summary.json'), 'utf8'));
  const answers: AnswerRecord[] = readdirSync(runDir)
    .filter((f) => f.endsWith('.json') && f !== 'summary.json')
    .map((f) => JSON.parse(readFileSync(join(runDir, f), 'utf8')));
  const cases: Case[] = summary.cases.map((id) => JSON.parse(readFileSync(join(root(suite), 'cases', `${id}.json`), 'utf8')));
  return { summary, cases, answers };
}

/** The model's final answer to one question, as it wrote it. */
export function givenAnswer(a: AnswerRecord, q: Question): unknown {
  return parseAnswers(a.text)?.[q.id];
}

export function formatAnswer(q: Question, v: unknown): string {
  const money = (n: unknown) => (typeof n === 'number' ? `£${n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : String(n ?? '–'));
  const o = (v ?? {}) as Record<string, unknown>;
  switch (q.kind) {
    case 'money':
      return money(typeof v === 'string' ? Number(v.replace(/[£,]/g, '')) : v);
    case 'name':
      return String(v ?? '–');
    case 'name+percent':
      return `${o.name ?? '–'}, ${typeof o.percent === 'number' ? `${o.percent.toFixed(1)}%` : (o.percent ?? '–')}`;
    case 'name+money':
      return `${o.name ?? '–'}, ${money(o.amount)}`;
  }
}

export function expectedAnswer(q: Question): string {
  const e = q.expected;
  return formatAnswer(q, q.kind === 'money' ? e.value : q.kind === 'name' ? e.name : q.kind === 'name+percent' ? { name: e.name, percent: e.value } : { name: e.name, amount: e.value });
}

export interface RankedModel {
  model: string;
  name: string;
  correct: number;
  total: number;
  cost: number;
  seconds: number;
  rank: number;
  /** Plain reason for its place, e.g. "All 30 right, cheapest of those". */
  why: string;
}

/**
 * Overall ranking for a test: most answers right first; ties go to the cheaper model, then the
 * faster one. Stated on the page so the pick can always explain itself (D-003).
 */
export function rankRun(run: TestRun): RankedModel[] {
  const rows = run.summary.models.map((m) => {
    const mine = run.answers.filter((a) => a.model === m.model);
    return {
      model: m.model,
      name: m.name,
      correct: mine.reduce((s, a) => s + a.score.correct, 0),
      total: mine.reduce((s, a) => s + a.score.total, 0),
      cost: m.cost_usd,
      seconds: m.avg_seconds ?? Infinity,
    };
  });
  rows.sort((a, b) => b.correct - a.correct || a.cost - b.cost || a.seconds - b.seconds);
  return rows.map((r, i) => {
    const tied = rows.filter((x) => x.correct === r.correct);
    const all = r.correct === r.total ? `All ${r.total} right` : `${r.correct} of ${r.total} right`;
    const place = tied.length > 1 ? (tied[0] === r ? ', cheapest of those' : tied.at(-1) === r ? ', most expensive of those' : '') : '';
    return { ...r, rank: i + 1, why: `${all}${place}` };
  });
}
