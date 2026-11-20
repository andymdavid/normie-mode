import { existsSync, readFileSync, renameSync, writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

// Ignore presentation punctuation only. Version numbers and effort labels remain identity keys.
export const identityKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
export function aliasMap(entries: [string, string][]) {
  const out = new Map<string, string>();
  for (const [alias, model] of entries) {
    const key = identityKey(alias);
    if (out.has(key) && out.get(key) !== model) throw new Error(`Ambiguous model alias: ${alias}`);
    out.set(key, model);
  }
  return out;
}
export function guardSnapshot(name: string, next: any, previous?: any) {
  const key = name === 'epoch' ? 'results' : name === 'modelsdev' ? 'models' : 'entries';
  const rows = next[key];
  if (!next.meta?.retrieved_at || !Number.isFinite(Date.parse(next.meta.retrieved_at))) throw new Error(`${name}: missing retrieval provenance`);
  if (!Array.isArray(rows) || rows.length === 0) throw new Error(`${name}: zero matched records; preserve the accepted snapshot and review aliases`);
  const old = previous?.[key] ?? [];
  if (old.length && rows.length < old.length * 0.7) throw new Error(`${name}: coverage loss ${old.length} -> ${rows.length}; human review required`);
  const priorModels = new Set(old.map((r: any) => r.model));
  const models = new Set(rows.map((r: any) => r.model));
  if (priorModels.size && models.size < priorModels.size * 0.7) throw new Error(`${name}: model coverage loss`);
  if (name === 'modelsdev') {
    for (const row of rows) {
      const prior = old.find((entry: any) => entry.model === row.model && entry.source_model === row.source_model);
      if (prior?.released_on && row.released_on && prior.released_on !== row.released_on && !row.archived_retrieved_at)
        throw new Error(`modelsdev: mutable alias changed version for ${row.model} (${prior.released_on} -> ${row.released_on}); review exact identity before importing`);
    }
  }
  if (name === 'lmarena') {
    const oldCategories = new Set(old.map((r: any) => r.category));
    for (const category of oldCategories) if (!rows.some((r: any) => r.category === category)) throw new Error(`lmarena: missing category ${category}`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(next.meta?.as_of ?? '')) throw new Error('lmarena: missing source date');
    if (previous?.meta?.as_of && next.meta.as_of < previous.meta.as_of) throw new Error('lmarena: source date moved backwards');
  }
  for (const row of rows) {
    if (name === 'epoch' && !Number.isFinite(row.value)) throw new Error('epoch: invalid value');
    if (name === 'lmarena' && !Number.isFinite(row.rating)) throw new Error('lmarena: invalid rating');
    if (!row.model) throw new Error(`${name}: missing model identity`);
    for (const field of ['value', 'rating', 'lower', 'upper', 'votes', 'rank', 'context', 'max_output']) {
      if (row[field] !== undefined && !Number.isFinite(row[field])) throw new Error(`${name}: invalid ${field}`);
    }
  }
}
export function publishSnapshots(directory: string, snapshots: Map<string, unknown>) {
  // Validate the complete batch before touching accepted files. Roll back if any filesystem write fails.
  const originals = new Map<string, Buffer | undefined>();
  for (const [name, data] of snapshots) {
    const path = join(directory, `${name}.json`);
    const original = existsSync(path) ? readFileSync(path) : undefined;
    originals.set(path, original);
    guardSnapshot(name, data, original ? JSON.parse(original.toString()) : undefined);
  }
  const staged: string[] = [];
  try {
    for (const [name, data] of snapshots) {
      const path = join(directory, `${name}.json.next`);
      writeFileSync(path, `${JSON.stringify(data, null, 1)}\n`); staged.push(path);
    }
    for (const path of staged) renameSync(path, path.slice(0, -5));
  } catch (error) {
    for (const [path, original] of originals) {
      if (original) writeFileSync(path, original); else if (existsSync(path)) unlinkSync(path);
    }
    throw error;
  } finally { for (const path of staged) if (existsSync(path)) unlinkSync(path); }
}
