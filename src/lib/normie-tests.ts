// Reads our own test runs (evals/<suite>/results/<run>/) for the site. Published and scored as
// "Tested by us" evidence since the product owner signed off the first run (2026-09-27).
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
  /** Combined summary: one entry per model, from that model's most recent run. */
  summary: RunSummary;
  cases: Case[];
  answers: AnswerRecord[];
  /** Every run folder the combined results draw on, oldest first. */
  runIds: string[];
}

const EVALS = join(process.cwd(), 'evals');

interface SavedRun {
  id: string;
  summary: RunSummary & { version?: string; mock?: boolean };
  answers: AnswerRecord[];
}

function savedRuns(suite: string, base: string): SavedRun[] {
  const dir = join(base, suite, 'results');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((d) => !d.endsWith('-mock') && existsSync(join(dir, d, 'summary.json')))
    .sort()
    .map((id) => {
      const runDir = join(dir, id);
      return {
        id,
        summary: JSON.parse(readFileSync(join(runDir, 'summary.json'), 'utf8')),
        answers: readdirSync(runDir)
          .filter((f) => f.endsWith('.json') && f !== 'summary.json')
          .map((f) => JSON.parse(readFileSync(join(runDir, f), 'utf8'))),
      };
    })
    .filter((r) => !r.summary.mock);
}

/**
 * The published results of a suite: every real run of its latest version, combined, with each
 * model taken from its most recent run. So a run that only adds models (e.g. two new ones) adds to
 * the results instead of replacing them, and a model re-run later replaces only its own answers.
 */
export function publishedRun(suite: string, base = EVALS): TestRun | undefined {
  const runs = savedRuns(suite, base);
  if (!runs.length) return undefined;
  const version = runs.at(-1)!.summary.version;
  const current = runs.filter((r) => r.summary.version === version);
  const byModel = new Map<string, SavedRun>();
  for (const r of current) for (const m of r.summary.models) byModel.set(m.model, r);
  const models = [...byModel].map(([model, r]) => r.summary.models.find((m) => m.model === model)!);
  const used = current.filter((r) => [...byModel.values()].includes(r));
  const latest = used.at(-1)!;
  const summary: RunSummary = {
    ...latest.summary,
    models,
    total_cost_usd: Number(models.reduce((sum, m) => sum + m.cost_usd, 0).toFixed(4)),
  };
  const answers = [...byModel].flatMap(([model, r]) => r.answers.filter((a) => a.model === model));
  const cases: Case[] = summary.cases.map((id) => JSON.parse(readFileSync(join(base, suite, 'cases', `${id}.json`), 'utf8')));
  return { summary, cases, answers, runIds: used.map((r) => r.id) };
}

/** When the published results were run: "24 Sept 2026", or "24–28 Sept 2026" across several runs. */
export function runDates(run: TestRun): string {
  const day = (id: string) => new Date(`${id.slice(0, 10)}T00:00:00Z`);
  const fmt = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleDateString('en-GB', { ...o, timeZone: 'UTC' });
  const [a, b] = [day(run.runIds[0]), day(run.runIds.at(-1)!)];
  if (a.getTime() === b.getTime()) return fmt(a, { day: 'numeric', month: 'short', year: 'numeric' });
  return `${fmt(a, { day: 'numeric', month: 'short' })} – ${fmt(b, { day: 'numeric', month: 'short', year: 'numeric' })}`;
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
