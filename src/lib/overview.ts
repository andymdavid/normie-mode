// Builds the translated comparison rows for the overview (N-002) from imported snapshots.
// Every figure keeps a pointer to where it came from; translation constants are named and shown on the page.
import { graph } from './graph';
import { comparedModels } from './plans';
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

export function overviewRows(): OverviewRow[] {
  const g = graph();
  const { epoch, modelsdev, lmarena } = imported();
  const current = comparedModels();
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
    };
  });

  const arenaRanked = rows.filter((r) => r.arena).sort((a, b) => b.arena!.rating - a.arena!.rating);
  arenaRanked.forEach((r, i) => Object.assign(r.arena!, { here: i + 1, of: arenaRanked.length }));

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
