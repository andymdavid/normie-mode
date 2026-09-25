// Imported evidence snapshots (D-019). Written by scripts/import.ts into data/, read by pages.
// Values keep the source's own model identifier so provenance survives the mapping.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export interface SnapshotMeta {
  source: 'epoch' | 'modelsdev' | 'lmarena';
  name: string;
  url: string;
  licence: string;
  attribution: string;
  retrieved_at: string;
  /** The source's own "as of" date where it states one. */
  as_of?: string;
}

export interface EpochBenchmark {
  name: string;
  file: string;
  score_column: string;
  random_baseline: number;
  score_ceiling: number;
  released_on?: string;
  in_index: boolean;
}

export interface EpochResult {
  model: string;
  source_model: string;
  effort?: string;
  benchmark: string;
  /** Fraction 0–1 after applying Epoch's scale. */
  value: number;
  stderr?: number;
  evaluated_on?: string;
  source_link?: string;
}

export interface EpochIndexEntry {
  model: string;
  source_model: string;
  eci: number;
  low: number;
  high: number;
}

export interface EpochSnapshot {
  meta: SnapshotMeta;
  benchmarks: EpochBenchmark[];
  index: EpochIndexEntry[];
  results: EpochResult[];
}

export interface ModelsDevEntry {
  model: string;
  source_model: string;
  name: string;
  released_on?: string;
  /** USD per million tokens. */
  price?: { input?: number; output?: number; cache_read?: number };
  context?: number;
  max_output?: number;
  input_modalities: string[];
  output_modalities: string[];
  reasoning?: boolean;
  tool_call?: boolean;
  open_weights?: boolean;
  knowledge?: string;
}

export interface ModelsDevSnapshot {
  meta: SnapshotMeta;
  models: ModelsDevEntry[];
}

export interface ArenaEntry {
  model: string;
  source_model: string;
  category: string;
  rating: number;
  lower: number;
  upper: number;
  votes: number;
  rank: number;
}

export interface ArenaSnapshot {
  meta: SnapshotMeta;
  /** Number of models ranked in the overall category, for "rank N of M". */
  overall_count: number;
  entries: ArenaEntry[];
}

export interface Imported {
  epoch?: EpochSnapshot;
  modelsdev?: ModelsDevSnapshot;
  lmarena?: ArenaSnapshot;
}

export const DATA_DIR = join(process.cwd(), 'data');

function read<T>(name: string): T | undefined {
  const f = join(DATA_DIR, `${name}.json`);
  return existsSync(f) ? (JSON.parse(readFileSync(f, 'utf8')) as T) : undefined;
}

let cached: { data: Imported; at: number } | undefined;
const MAX_AGE_MS = process.env.NODE_ENV === 'production' ? Infinity : 2000;

/** Imported snapshots, reloaded after 2s outside production builds so `astro dev` sees re-imports. */
export function imported(): Imported {
  if (!cached || Date.now() - cached.at > MAX_AGE_MS) {
    cached = {
      data: { epoch: read<EpochSnapshot>('epoch'), modelsdev: read<ModelsDevSnapshot>('modelsdev'), lmarena: read<ArenaSnapshot>('lmarena') },
      at: Date.now(),
    };
  }
  return cached.data;
}
