// Task pages (D-025): each in-scope search intent becomes a page built from its tests.
// Tests are labelled by how closely they match the task; the task score uses only close ones.
import type { BarDatum } from '../components/BarChart.astro';
import { graph } from './graph';
import { imported } from './imported';
import type { Closeness, Intent, ModelVersion, Test } from './schema';
import { demandByIntent } from './demand';
import { comparedModels } from './plans';
import { latestRun } from './normie-tests';
import { formatDate } from './view';

/** The models on every chart: current versions plus older ones still used by an app's plan (D-026). */
export function currentModels(): ModelVersion[] {
  return comparedModels();
}

export function makerOf(m: ModelVersion): string {
  return graph().families.get(m.family)?.provider ?? m.family;
}

export const ordinal = (n: number) =>
  `${n}${n % 10 === 1 && n % 100 !== 11 ? 'st' : n % 10 === 2 && n % 100 !== 12 ? 'nd' : n % 10 === 3 && n % 100 !== 13 ? 'rd' : 'th'}`;

/**
 * Label each bar with its position ("1st", "10th") instead of a score that means nothing on its
 * own (N-011). The bar length still shows the gaps; the raw figure stays in the tooltip.
 */
export function withPositions(rows: BarDatum[]): BarDatum[] {
  const ranked = rows.filter((r) => r.value !== undefined).sort((a, b) => b.value! - a.value!);
  return rows.map((r) => (r.value === undefined ? r : { ...r, display: ordinal(ranked.indexOf(r) + 1) }));
}

/** Tests with fewer models than this get no ranking: two results can't show who's best. */
export const MIN_MODELS_TO_RANK = 3;

/** Bar rows for one test: best result per model across reasoning-effort settings. */
export function testRows(test: Test): BarDatum[] {
  const rows = rawTestRows(test);
  return test.source === 'lmarena' ? withPositions(rows) : rows;
}

/** Our own test: share of answers right per model, from the latest run of the suite. */
function ourTestRows(test: Test): BarDatum[] {
  const run = latestRun(test.key);
  return currentModels().map((m) => {
    const base = { id: m.id, label: m.name, maker: makerOf(m), href: `/models/${m.id}` };
    const mine = run?.answers.filter((a) => a.model === m.id) ?? [];
    if (!mine.length) return base;
    const correct = mine.reduce((s, a) => s + a.score.correct, 0);
    const total = mine.reduce((s, a) => s + a.score.total, 0);
    const v = (100 * correct) / total;
    return { ...base, value: v, display: `${correct}/${total}`, tip: `${m.name}: ${correct} of ${total} answers right in our test` };
  });
}

export const isOurTest = (test: Test) => test.source === 'normie';

function rawTestRows(test: Test): BarDatum[] {
  if (isOurTest(test)) return ourTestRows(test);
  const { epoch, lmarena } = imported();
  return currentModels().map((m) => {
    const base = { id: m.id, label: m.name, maker: makerOf(m), href: `/models/${m.id}` };
    if (test.source === 'epoch') {
      const hits = (epoch?.results ?? []).filter((r) => r.model === m.id && r.benchmark === test.key);
      const best = hits.sort((a, b) => b.value - a.value)[0];
      if (!best) return base;
      const v = best.value * 100;
      const e = best.stderr !== undefined ? best.stderr * 196 : undefined;
      return {
        ...base,
        value: v,
        display: `${v.toFixed(0)}%`,
        low: e !== undefined ? Math.max(0, v - e) : undefined,
        high: e !== undefined ? Math.min(100, v + e) : undefined,
        tip: `${m.name}: ${v.toFixed(1)}%${best.effort ? ` (${best.effort} effort)` : ''}${e !== undefined ? `, likely ${Math.max(0, v - e).toFixed(0)}–${Math.min(100, v + e).toFixed(0)}%` : ''}`,
      };
    }
    const hits = (lmarena?.entries ?? []).filter((e) => e.model === m.id && e.category === test.key);
    const best = hits.sort((a, b) => b.rating - a.rating)[0];
    if (!best) return base;
    return {
      ...base,
      value: best.rating,
      display: best.rating.toFixed(0),
      low: best.lower,
      high: best.upper,
      tip: `${m.name}: rating ${best.rating.toFixed(0)} (likely ${best.lower.toFixed(0)}–${best.upper.toFixed(0)}) from ${best.votes.toLocaleString('en-GB')} votes`,
    };
  });
}

/** Axis floor so rating differences are visible (ratings cluster far from zero). */
export function testFloor(test: Test, rows: BarDatum[]): number {
  if (test.source !== 'lmarena') return 0;
  const lows = rows.filter((r) => r.low !== undefined).map((r) => r.low!);
  return lows.length ? Math.floor((Math.min(...lows) - 25) / 25) * 25 : 0;
}

export function testSource(test: Test) {
  if (isOurTest(test)) {
    const run = latestRun(test.key);
    return { name: 'Normie Mode, tested by us', url: test.url, note: run ? `run ${formatDate(run.summary.run_id.slice(0, 10))} · see every answer` : undefined };
  }
  return test.source === 'epoch'
    ? { name: `${test.by} via Epoch AI`, url: test.url, note: 'CC BY 4.0' }
    : { name: 'LMArena', url: test.url, note: `votes as of ${formatDate(imported().lmarena?.meta.as_of)}` };
}

/** "A leads, followed by B and C." Names are plain text; the chart carries the numbers. */
/**
 * The top two are statistically tied when their likely ranges overlap. Shared by the chart's
 * summary line and Norm's note so the two can never disagree.
 */
export function topTwoTied(rows: BarDatum[], lowerIsBetter = false): [BarDatum, BarDatum] | undefined {
  const [a, b] = rows.filter((r) => r.value !== undefined).sort((x, y) => (lowerIsBetter ? x.value! - y.value! : y.value! - x.value!));
  if (!a || !b || lowerIsBetter || a.low === undefined || b.high === undefined) return undefined;
  return a.low <= b.high ? [a, b] : undefined;
}

export function leadSentence(rows: BarDatum[], lowerIsBetter = false, verb = 'leads'): string | undefined {
  const sorted = rows.filter((r) => r.value !== undefined).sort((a, b) => (lowerIsBetter ? a.value! - b.value! : b.value! - a.value!));
  if (sorted.length < MIN_MODELS_TO_RANK) return undefined;
  // Exactly level at the top (e.g. several models got every answer right): name them all.
  const level = sorted.filter((r) => r.value === sorted[0].value);
  if (level.length > 1) {
    const names = level.map((r) => r.label);
    const list = `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
    return level.length === sorted.length ? `${list} all score the same.` : `${list} are level at the top.`;
  }
  if (topTwoTied(rows, lowerIsBetter)) {
    const next = sorted.slice(2, 4).map((r) => r.label);
    return `${sorted[0].label} and ${sorted[1].label} are neck and neck at the top${next.length ? `, followed by ${next.join(' and ')}` : ''}.`;
  }
  const [a, ...rest] = sorted;
  const next = rest.slice(0, 2).map((r) => r.label);
  return `${a.label} ${verb}, followed by ${next.join(' and ')}.`;
}

export const CLOSENESS_LABEL: Record<Closeness, string> = {
  direct: 'Tests this task',
  related: 'Tests a related skill',
  general: 'General ability',
};

export interface Leader {
  model: ModelVersion;
  /** Average relative position (0–1) across the task's usable tests. */
  score: number;
  tests: number;
  /** How many of those are tests of real work rather than people's votes. */
  workTests: number;
}

/**
 * A task's evidence: its own tests, or its hub's if it's a specific task without its own.
 * Inherited tests measure the broader task, so they count as related at best, never direct.
 */
export function effectiveTests(task: Intent): Intent['tests'] {
  if (task.tests.length || !task.parent) return task.tests;
  return (graph().intents.get(task.parent)?.tests ?? []).map((t) => ({ ...t, closeness: t.closeness === 'direct' ? 'related' : t.closeness }));
}

/** Tests that count towards the task score: direct and related ones, or general ones if that's all there is. */
export function scoringTests(task: Intent): Test[] {
  const g = graph();
  const tests = effectiveTests(task);
  const close = tests.filter((t) => t.closeness !== 'general');
  return (close.length ? close : tests).map((t) => g.tests.get(t.test)!);
}

export function leaders(task: Intent): { leaders: Leader[]; testsUsed: number; workTestsUsed: number; placements: Map<string, Map<string, number>>; used: Test[] } {
  const g = graph();
  const totals = new Map<string, { sum: number; n: number; work: number }>();
  /** Model -> test -> place on that test (0 lowest, 1 highest), for showing how a score is made. */
  const placements = new Map<string, Map<string, number>>();
  const used: Test[] = [];
  let testsUsed = 0;
  let workTestsUsed = 0;
  for (const test of scoringTests(task)) {
    const rows = testRows(test).filter((r) => r.value !== undefined);
    if (rows.length < 3) continue;
    testsUsed++;
    used.push(test);
    const work = test.source !== 'lmarena';
    if (work) workTestsUsed++;
    const vals = rows.map((r) => r.value!);
    const max = Math.max(...vals), min = Math.min(...vals);
    for (const r of rows) {
      const place = max === min ? 1 : (r.value! - min) / (max - min);
      const t = totals.get(r.id) ?? { sum: 0, n: 0, work: 0 };
      totals.set(r.id, { sum: t.sum + place, n: t.n + 1, work: t.work + (work ? 1 : 0) });
      placements.set(r.id, (placements.get(r.id) ?? new Map()).set(test.id, place));
    }
  }
  const out = [...totals]
    .map(([id, t]) => ({ model: g.models.get(id)!, score: t.sum / t.n, tests: t.n, workTests: t.work }))
    .sort((a, b) => b.score - a.score);
  return { leaders: out, testsUsed, workTestsUsed, placements, used };
}

/**
 * Task score (0–100): on each usable test, place every model between the lowest (0) and highest
 * (100) score, then average across the tests it has results for. Only models with results on at
 * least half the usable tests get a score, and when the task has tests of real work, a model needs
 * at least one of them: people's votes alone can't put a model on the chart (D-029).
 */
export function taskScores(task: Intent): { rows: BarDatum[]; testsUsed: number; closeness: Closeness | undefined } {
  const { leaders: ls, testsUsed, workTestsUsed } = leaders(task);
  const min = Math.max(1, Math.ceil(testsUsed / 2));
  const rows = ls
    .filter((l) => l.tests >= min && (workTestsUsed === 0 || l.workTests > 0))
    .map((l) => ({
      id: l.model.id,
      label: l.model.name,
      maker: makerOf(l.model),
      href: `/models/${l.model.id}`,
      value: l.score * 100,
      tip: `${l.model.name}: task score ${(l.score * 100).toFixed(0)} out of 100, from ${l.tests} of ${testsUsed} test${testsUsed === 1 ? '' : 's'}`,
    }));
  const used = scoringTests(task).map((t) => effectiveTests(task).find((x) => x.test === t.id)!.closeness);
  const closeness = used.includes('direct') ? 'direct' : used.includes('related') ? 'related' : used[0];
  return { rows: withPositions(rows), testsUsed, closeness };
}

/**
 * Hub tasks with their own page, most searched-for first. A hub's share includes the searches
 * that matched its more specific tasks.
 */
export function tasksByDemand(): { task: Intent; share: number }[] {
  const d = demandByIntent().intents;
  return d
    .filter((x) => x.intent.scope === 'in' && !x.intent.page && !x.intent.parent)
    .map((x) => ({ task: x.intent, share: x.share + d.filter((c) => c.intent.parent === x.intent.id).reduce((s, c) => s + c.share, 0) }))
    .sort((a, b) => b.share - a.share);
}

/** A hub's more specific tasks, most searched-for first. */
export function subtasksOf(hubId: string): { task: Intent; share: number }[] {
  return demandByIntent()
    .intents.filter((x) => x.intent.parent === hubId)
    .map((x) => ({ task: x.intent, share: x.share }));
}

/** Every task that gets a page: hubs and their specific tasks. */
export function allTaskPages(): Intent[] {
  return tasksByDemand().flatMap(({ task }) => [task, ...subtasksOf(task.id).map((s) => s.task)]);
}

export const taskPath = (task: Intent) => `/best-ai-for/${task.id}`;

/** Norm's shared lines, e.g. how to read a chart. */
const LINE_MOODS: Record<string, 'default' | 'happy' | 'smug' | 'wise'> = {
  bars: 'happy',
  tasks: 'happy',
  votes: 'wise',
  cost: 'default',
  normie_test: 'happy',
};

export function normLine(key: string): { text?: string; status: 'draft' | 'approved'; mood?: 'default' | 'happy' | 'smug' | 'wise' } {
  const set = graph().norm.get('charts');
  return { text: set?.lines[key], status: set?.status ?? 'draft', mood: LINE_MOODS[key] };
}
