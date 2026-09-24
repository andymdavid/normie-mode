// Turns a job's tests into chart rows for the current models, and summarises who leads.
import type { BarDatum } from '../components/BarChart.astro';
import { graph } from './graph';
import { imported } from './imported';
import type { Job, ModelVersion, Test } from './schema';
import { formatDate } from './view';

export function currentModels(): ModelVersion[] {
  return [...graph().models.values()].filter((m) => m.lifecycle === 'current');
}

export function makerOf(m: ModelVersion): string {
  return graph().families.get(m.family)?.provider ?? m.family;
}

/** Bar rows for one test: best result per model across reasoning-effort settings. */
export function testRows(test: Test): BarDatum[] {
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
  if (test.source === 'epoch') return 0;
  const lows = rows.filter((r) => r.low !== undefined).map((r) => r.low!);
  return lows.length ? Math.floor((Math.min(...lows) - 25) / 25) * 25 : 0;
}

export function testSource(test: Test) {
  return test.source === 'epoch'
    ? { name: `${test.by} via Epoch AI`, url: test.url, note: 'CC BY 4.0' }
    : { name: 'LMArena', url: test.url, note: `votes as of ${formatDate(imported().lmarena?.meta.as_of)}` };
}

/** "A leads, followed by B and C." Names are plain text; the chart carries the numbers. */
export function leadSentence(rows: BarDatum[], lowerIsBetter = false, verb = 'leads'): string | undefined {
  const sorted = rows.filter((r) => r.value !== undefined).sort((a, b) => (lowerIsBetter ? a.value! - b.value! : b.value! - a.value!));
  if (sorted.length < 2) return undefined;
  const [a, ...rest] = sorted;
  const next = rest.slice(0, 2).map((r) => r.label);
  return `${a.label} ${verb}, followed by ${next.join(' and ')}.`;
}

export interface JobLeader {
  model: ModelVersion;
  /** Average relative position (0–1) across the job's tests that have at least three models. */
  score: number;
  tests: number;
}

export function jobLeaders(job: Job): { leaders: JobLeader[]; testsUsed: number } {
  const g = graph();
  const totals = new Map<string, { sum: number; n: number }>();
  let testsUsed = 0;
  for (const id of job.tests) {
    const rows = testRows(g.tests.get(id)!).filter((r) => r.value !== undefined);
    if (rows.length < 3) continue;
    testsUsed++;
    const vals = rows.map((r) => r.value!);
    const max = Math.max(...vals), min = Math.min(...vals);
    for (const r of rows) {
      const t = totals.get(r.id) ?? { sum: 0, n: 0 };
      totals.set(r.id, { sum: t.sum + (max === min ? 1 : (r.value! - min) / (max - min)), n: t.n + 1 });
    }
  }
  const leaders = [...totals]
    .map(([id, t]) => ({ model: g.models.get(id)!, score: t.sum / t.n, tests: t.n }))
    .sort((a, b) => b.score - a.score);
  return { leaders, testsUsed };
}

export function jobsInOrder(): Job[] {
  return [...graph().jobs.values()].sort((a, b) => a.order - b.order);
}
