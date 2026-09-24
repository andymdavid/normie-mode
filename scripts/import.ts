// Refreshes imported evidence (N-001): Epoch AI, models.dev, LMArena.
// Usage: npm run import [-- --offline]   (--offline reuses files already in .cache/)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseCsv } from 'csv-parse/sync';
import { unzipSync, strFromU8 } from 'fflate';
import { parquetReadObjects } from 'hyparquet';
import { loadGraph } from '../src/lib/graph';
import {
  DATA_DIR,
  type ArenaEntry,
  type ArenaSnapshot,
  type EpochBenchmark,
  type EpochIndexEntry,
  type EpochResult,
  type EpochSnapshot,
  type ModelsDevEntry,
  type ModelsDevSnapshot,
} from '../src/lib/imported';

const CACHE = join(process.cwd(), '.cache');
const OFFLINE = process.argv.includes('--offline');
const TRACKED_ORGS = /anthropic|openai|google|deepseek|moonshot/i;
const EFFORTS = new Set(['none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max', 'unknown']);
const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000).toISOString().slice(0, 10);

const g = loadGraph();
const models = [...g.models.values()];
const reverse = (pick: (m: (typeof models)[number]) => string[]) => {
  const map = new Map<string, string>();
  for (const m of models) for (const k of pick(m)) map.set(k, m.id);
  return map;
};
const epochIds = reverse((m) => m.source_ids.epoch);
const epochIndexIds = reverse((m) => (m.source_ids.epoch_index ? [m.source_ids.epoch_index] : []));
const modelsDevIds = reverse((m) => (m.source_ids.modelsdev ? [m.source_ids.modelsdev] : []));
const arenaIds = reverse((m) => m.source_ids.lmarena);

const report: string[] = [];

async function fetchCached(url: string, file: string): Promise<Buffer> {
  mkdirSync(CACHE, { recursive: true });
  const path = join(CACHE, file);
  if (OFFLINE && existsSync(path)) return readFileSync(path);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(path, buf);
  return buf;
}

function write(name: string, data: unknown) {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(join(DATA_DIR, `${name}.json`), `${JSON.stringify(data, null, 1)}\n`);
}

const num = (v: unknown) => (v === '' || v === undefined || v === null ? undefined : Number(v));

async function importEpoch() {
  const zip = unzipSync(new Uint8Array(await fetchCached('https://epoch.ai/data/benchmark_data.zip', 'epoch.zip')));
  const csv = (name: string): Record<string, string>[] => {
    const key = Object.keys(zip).find((k) => k.endsWith(`/${name}`) || k === name);
    return key ? parseCsv(strFromU8(zip[key]), { columns: true, skip_empty_lines: true, relax_column_count: true }) : [];
  };

  const benchmarks: EpochBenchmark[] = [];
  const results: EpochResult[] = [];
  const skipped: string[] = [];
  const unmapped = new Map<string, string>();

  // Some metadata rows omit their file and score column; find them by name instead.
  const FALLBACK_COLUMNS = ['Best score (across scorers)', 'mean_score', 'Score', 'Accuracy', 'Pass@1', 'Overall', 'Main score'];
  const files = new Set(Object.keys(zip).map((k) => k.split('/').pop()!));
  for (const b of csv('benchmark_metadata.csv')) {
    if (!b.source_file?.endsWith('.csv')) {
      const stem = b.benchmark.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
      const file = [`${stem}.csv`, `${stem}_external.csv`].find((f) => files.has(f));
      const header = file ? Object.keys(csv(file)[0] ?? {}) : [];
      const column = FALLBACK_COLUMNS.find((c) => header.includes(c));
      if (!file || !column) {
        skipped.push(b.benchmark);
        continue;
      }
      // Metadata columns are shifted on these rows: in_eci, then scale, baseline, ceiling, date.
      Object.assign(b, { source_file: file, score_column: column, scale: '1', random_baseline: b.source_file, score_ceiling: b.score_column, release_date: b.scale });
    }
    const scale = Number(b.scale) || 1;
    benchmarks.push({
      name: b.benchmark,
      file: b.source_file,
      score_column: b.score_column,
      random_baseline: Number(b.random_baseline) || 0,
      score_ceiling: Number(b.score_ceiling) || 1,
      released_on: b.release_date || undefined,
      in_index: b.in_eci === 'True',
    });
    for (const row of csv(b.source_file)) {
      const raw = row['Model version'];
      const score = num(row[b.score_column]);
      // Skip non-fraction scales (e.g. arena ratings) that would be misread as percentages.
      if (!raw || score === undefined || Number.isNaN(score) || score * scale > 1.5) continue;
      const cut = raw.lastIndexOf('_');
      const suffix = cut > 0 ? raw.slice(cut + 1) : '';
      const slug = EFFORTS.has(suffix) ? raw.slice(0, cut) : raw;
      const model = epochIds.get(slug);
      if (!model) {
        const org = row.Organization ?? '';
        if (TRACKED_ORGS.test(org) && (row['Release date'] ?? '') >= daysAgo(90)) unmapped.set(slug, row['Release date']);
        continue;
      }
      results.push({
        model,
        source_model: raw,
        effort: EFFORTS.has(suffix) ? suffix : undefined,
        benchmark: b.benchmark,
        value: score * scale,
        stderr: num(row.stderr ?? row['Accuracy Standard Error']),
        evaluated_on: (row['Started at'] || row['Last updated'] || '').slice(0, 10) || undefined,
        source_link: row['Source link (site from table)'] || row['Source link'] || row['Log viewer'] || undefined,
      });
    }
  }

  const index: EpochIndexEntry[] = [];
  for (const row of csv('eci_scores.csv')) {
    const model = epochIndexIds.get(row.Model);
    if (model) index.push({ model, source_model: row.Model, eci: Number(row.eci), low: Number(row.eci_ci_low), high: Number(row.eci_ci_high) });
    else if (TRACKED_ORGS.test(row.Organization ?? '') && (row.date ?? '') >= daysAgo(90)) unmapped.set(`index: ${row.Model}`, row.date);
  }

  const snapshot: EpochSnapshot = {
    meta: {
      source: 'epoch',
      name: 'Epoch AI Benchmarking Hub',
      url: 'https://epoch.ai/benchmarks',
      licence: 'CC BY 4.0',
      attribution: "Epoch AI, 'Capabilities & Benchmarking', https://epoch.ai/benchmarks",
      retrieved_at: now.toISOString(),
    },
    benchmarks,
    index,
    results,
  };
  write('epoch', snapshot);
  report.push(`Epoch: ${results.length} results across ${benchmarks.length} benchmarks, ${index.length} index scores.`);
  if (skipped.length) report.push(`  Skipped (no score file in metadata): ${skipped.join(', ')}`);
  for (const [slug, date] of unmapped) report.push(`  Unmapped recent model: ${slug} (${date})`);
}

async function importModelsDev() {
  const data = JSON.parse((await fetchCached('https://models.dev/api.json', 'modelsdev.json')).toString('utf8'));
  const out: ModelsDevEntry[] = [];
  const seen = new Set<string>();
  for (const [provider, p] of Object.entries<any>(data)) {
    for (const [id, m] of Object.entries<any>(p.models ?? {})) {
      const key = `${provider}/${id}`;
      const model = modelsDevIds.get(key);
      if (!model) {
        const textModel = (m.modalities?.output ?? []).includes('text') && !/image|tts|live|audio|embed/i.test(id);
        if (/^(anthropic|openai|google|deepseek|moonshotai)$/.test(provider) && textModel && (m.release_date ?? '') >= daysAgo(45)) {
          report.push(`  Unmapped recent models.dev model: ${key} (${m.release_date})`);
        }
        continue;
      }
      seen.add(model);
      out.push({
        model,
        source_model: key,
        name: m.name,
        released_on: m.release_date,
        price: m.cost ? { input: m.cost.input, output: m.cost.output, cache_read: m.cost.cache_read } : undefined,
        context: m.limit?.context,
        max_output: m.limit?.output,
        input_modalities: m.modalities?.input ?? [],
        output_modalities: m.modalities?.output ?? [],
        reasoning: m.reasoning,
        tool_call: m.tool_call,
        open_weights: m.open_weights,
        knowledge: m.knowledge,
      });
    }
  }
  const snapshot: ModelsDevSnapshot = {
    meta: {
      source: 'modelsdev',
      name: 'models.dev',
      url: 'https://models.dev',
      licence: 'MIT',
      attribution: 'models.dev (https://github.com/anomalyco/models.dev)',
      retrieved_at: now.toISOString(),
    },
    models: out,
  };
  write('modelsdev', snapshot);
  report.push(`models.dev: ${out.length} tracked models.`);
  for (const m of models.filter((m) => m.source_ids.modelsdev && !seen.has(m.id))) report.push(`  Missing from models.dev: ${m.source_ids.modelsdev}`);
}

async function importArena() {
  const buf = await fetchCached(
    'https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset/resolve/main/text/latest-00000-of-00001.parquet',
    'lmarena-text.parquet',
  );
  const rows = (await parquetReadObjects({ file: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer })) as any[];
  const entries: ArenaEntry[] = [];
  let asOf = '';
  for (const r of rows) {
    asOf = r.leaderboard_publish_date ?? asOf;
    const model = arenaIds.get(r.model_name);
    if (!model) {
      if (r.category === 'overall' && TRACKED_ORGS.test(r.organization ?? '') && Number(r.rank) <= 60) {
        report.push(`  Unmapped LMArena model: ${r.model_name} (rank ${r.rank})`);
      }
      continue;
    }
    entries.push({
      model,
      source_model: r.model_name,
      category: r.category,
      rating: Number(r.rating),
      lower: Number(r.rating_lower),
      upper: Number(r.rating_upper),
      votes: Number(r.vote_count),
      rank: Number(r.rank),
    });
  }
  const snapshot: ArenaSnapshot = {
    meta: {
      source: 'lmarena',
      name: 'LMArena text leaderboard',
      url: 'https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset',
      licence: 'CC BY 4.0',
      attribution: 'LMArena leaderboard dataset (lmarena-ai/leaderboard-dataset)',
      retrieved_at: now.toISOString(),
      as_of: asOf || undefined,
    },
    overall_count: rows.filter((r) => r.category === 'overall').length,
    entries,
  };
  write('lmarena', snapshot);
  report.push(`LMArena: ${entries.length} entries for tracked models (leaderboard as of ${asOf}).`);
}

for (const [name, run] of [['Epoch', importEpoch], ['models.dev', importModelsDev], ['LMArena', importArena]] as const) {
  try {
    await run();
  } catch (e) {
    report.push(`${name} FAILED: ${(e as Error).message}`);
    process.exitCode = 1;
  }
}
console.log(report.join('\n'));
