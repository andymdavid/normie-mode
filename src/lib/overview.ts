// Builds the translated comparison rows for the overview (N-002) from imported snapshots.
// Every figure keeps a pointer to where it came from; translation constants are named and shown on the page.
import { graph } from './graph';
import { imported, type ArenaEntry, type EpochResult } from './imported';
import type { MakerClaim, ModelVersion } from './schema';

/** A "typical request": about 1,500 words in and 500 words out (~2,000 and ~700 tokens). */
export const TYPICAL_REQUEST = { inputTokens: 2000, outputTokens: 700, words: '1,500 words in, 500 out' };
export const WORDS_PER_TOKEN = 0.75;
export const WORDS_PER_PAGE = 500;
/** D-020 thresholds: independent test counts for evidence status. */
export const TESTED_THRESHOLD = 8;
/** "Best value" rule: most capable model under this cost per 1,000 typical requests. */
export const VALUE_BUDGET = 5;

export type EvidenceStatus = 'maker-says' | 'early' | 'tested';
export const EVIDENCE_STATUS_LABEL: Record<EvidenceStatus, string> = {
  'maker-says': 'The maker says',
  early: 'Early results',
  tested: 'Independently tested',
};

export interface AreaDef {
  id: string;
  label: string;
  plain: string;
  kind: 'epoch' | 'arena';
  /** Epoch benchmark names, or one LMArena category. */
  keys: string[];
}

/** Proposed plain-English areas (see D-005 successor; needs product-owner review). */
export const AREAS: AreaDef[] = [
  { id: 'coding', label: 'Writing code', plain: 'Building and fixing real software', kind: 'epoch', keys: ['FrontierCode', 'DeepSWE', 'Terminal Bench', 'SWE-Bench verified'] },
  { id: 'agents', label: 'Doing work on its own', plain: 'Multi-step professional tasks with tools', kind: 'epoch', keys: ['APEX-Agents', 'Remote Labor Index'] },
  { id: 'facts', label: 'Getting facts right', plain: 'Short factual questions, without making things up', kind: 'epoch', keys: ['SimpleQA Verified'] },
  { id: 'expert', label: 'Expert questions', plain: 'Graduate-level science and very hard exam questions', kind: 'epoch', keys: ['GPQA diamond', 'HLE'] },
  { id: 'maths', label: 'Maths', plain: 'Competition and research-level maths problems', kind: 'epoch', keys: ['FrontierMath-Tiers-1-3-v2-Private', 'OTIS Mock AIME 2024-2025'] },
  { id: 'puzzles', label: 'New kinds of problems', plain: "Puzzles it can't have memorised", kind: 'epoch', keys: ['ARC-AGI-2', 'Mystery Game Puzzles'] },
  { id: 'business', label: 'Business questions', plain: 'Which answers people preferred for business, management and finance questions', kind: 'arena', keys: ['industry_business_and_management_and_financial_operations'] },
  { id: 'writing', label: 'Creative writing', plain: 'Which answers people preferred for creative writing', kind: 'arena', keys: ['creative_writing'] },
];

export interface AreaCell {
  /** 1 = best among the models shown that have results here. */
  rank: number;
  of: number;
  /** 0–1 relative position among those models, for shading. */
  strength: number;
  tests: number;
}

export interface OverviewRow {
  model: ModelVersion;
  maker: string;
  eci?: { value: number; low: number; high: number };
  /** `rank` is LMArena's overall rank; `here` is the position among the models on this page. */
  arena?: { rank: number; here: number; of: number; rating: number; votes: number };
  costPer1000?: number;
  price?: { input?: number; output?: number };
  contextPages?: number;
  openWeights?: boolean;
  independentTests: number;
  status: EvidenceStatus;
  claim?: MakerClaim;
  areas: Record<string, AreaCell | undefined>;
}

function best<T>(items: T[], score: (t: T) => number): T | undefined {
  return items.reduce<T | undefined>((a, b) => (a === undefined || score(b) > score(a) ? b : a), undefined);
}

/** Best score per model per benchmark across reasoning-effort settings (Epoch's own convention). */
function bestEpoch(results: EpochResult[]): Map<string, Map<string, number>> {
  const out = new Map<string, Map<string, number>>();
  for (const r of results) {
    const m = out.get(r.model) ?? new Map<string, number>();
    m.set(r.benchmark, Math.max(m.get(r.benchmark) ?? -Infinity, r.value));
    out.set(r.model, m);
  }
  return out;
}

function rankCells(values: Map<string, number>): Map<string, AreaCell> {
  const sorted = [...values.entries()].sort((a, b) => b[1] - a[1]);
  const max = sorted[0]?.[1] ?? 0;
  const min = sorted.at(-1)?.[1] ?? 0;
  return new Map(
    sorted.map(([model, v], i) => [model, { rank: i + 1, of: sorted.length, strength: max === min ? 1 : (v - min) / (max - min), tests: 1 }]),
  );
}

export function overviewRows(): OverviewRow[] {
  const g = graph();
  const { epoch, modelsdev, lmarena } = imported();
  const current = [...g.models.values()].filter((m) => m.lifecycle === 'current');
  const ids = new Set(current.map((m) => m.id));
  const epochBest = bestEpoch((epoch?.results ?? []).filter((r) => ids.has(r.model)));

  const rows: OverviewRow[] = current.map((model) => {
    const spec = modelsdev?.models.find((m) => m.model === model.id);
    const idx = epoch?.index.find((i) => i.model === model.id);
    const arenaOverall = best(
      (lmarena?.entries ?? []).filter((e) => e.model === model.id && e.category === 'overall'),
      (e: ArenaEntry) => e.rating,
    );
    const independentTests = epochBest.get(model.id)?.size ?? 0;
    const claim = [...g.claims.values()].find((c) => c.model_version === model.id);
    const price = spec?.price;
    return {
      model,
      maker: g.families.get(model.family)?.provider ?? model.family,
      eci: idx ? { value: idx.eci, low: idx.low, high: idx.high } : undefined,
      arena: arenaOverall ? { rank: arenaOverall.rank, here: 0, of: 0, rating: arenaOverall.rating, votes: arenaOverall.votes } : undefined,
      price,
      costPer1000:
        price?.input !== undefined && price.output !== undefined
          ? (1000 * (TYPICAL_REQUEST.inputTokens * price.input + TYPICAL_REQUEST.outputTokens * price.output)) / 1e6
          : undefined,
      contextPages: spec?.context ? Math.round((spec.context * WORDS_PER_TOKEN) / WORDS_PER_PAGE) : undefined,
      openWeights: spec?.open_weights,
      independentTests,
      status: independentTests === 0 ? 'maker-says' : independentTests < TESTED_THRESHOLD && !idx ? 'early' : 'tested',
      claim,
      areas: {},
    };
  });

  const arenaRanked = rows.filter((r) => r.arena).sort((a, b) => b.arena!.rating - a.arena!.rating);
  arenaRanked.forEach((r, i) => Object.assign(r.arena!, { here: i + 1, of: arenaRanked.length }));

  for (const area of AREAS) {
    // Average relative position across the area's benchmarks; rank on that average.
    const totals = new Map<string, { sum: number; n: number }>();
    for (const key of area.keys) {
      const values = new Map<string, number>();
      if (area.kind === 'epoch') {
        for (const [model, scores] of epochBest) if (scores.has(key)) values.set(model, scores.get(key)!);
      } else {
        for (const e of lmarena?.entries ?? []) {
          if (e.category === key && ids.has(e.model)) values.set(e.model, Math.max(values.get(e.model) ?? -Infinity, e.rating));
        }
      }
      if (values.size < 3) continue; // too few models to compare meaningfully
      for (const [model, cell] of rankCells(values)) {
        const t = totals.get(model) ?? { sum: 0, n: 0 };
        totals.set(model, { sum: t.sum + cell.strength, n: t.n + 1 });
      }
    }
    const averaged = new Map([...totals].map(([m, t]) => [m, t.sum / t.n]));
    const ranked = rankCells(averaged);
    for (const row of rows) {
      const cell = ranked.get(row.model.id);
      row.areas[area.id] = cell && { ...cell, strength: averaged.get(row.model.id)!, tests: totals.get(row.model.id)!.n };
    }
  }

  return rows.sort((a, b) => (b.eci?.value ?? -1) - (a.eci?.value ?? -1));
}

export interface Pick {
  label: string;
  row: OverviewRow;
  why: string;
}

export function picks(rows: OverviewRow[]): Pick[] {
  const out: Pick[] = [];
  const capable = best(rows.filter((r) => r.eci), (r) => r.eci!.value);
  if (capable) out.push({ label: 'Most capable overall', row: capable, why: `Highest Epoch capability score (${capable.eci!.value.toFixed(0)})` });
  const liked = best(rows.filter((r) => r.arena), (r) => -r.arena!.rank);
  if (liked) out.push({ label: "People's favourite", row: liked, why: `Top of the models here in blind votes on LMArena (#${liked.arena!.rank} overall)` });
  const value = best(rows.filter((r) => r.eci && r.costPer1000 !== undefined && r.costPer1000 <= VALUE_BUDGET), (r) => r.eci!.value);
  if (value) out.push({ label: 'Best value', row: value, why: `Most capable for under $${VALUE_BUDGET} per 1,000 typical requests` });
  const newest = best(rows.filter((r) => r.model.released_on), (r) => Date.parse(r.model.released_on!));
  if (newest) out.push({ label: 'Newest', row: newest, why: `Released ${new Date(newest.model.released_on! + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })}; ${EVIDENCE_STATUS_LABEL[newest.status].toLowerCase()}` });
  return out;
}
