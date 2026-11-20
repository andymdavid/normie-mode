import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { aliasMap, identityKey, guardSnapshot, publishSnapshots } from './import-guards';
const snapshot = (count: number) => ({ meta: { as_of: '2026-11-19', retrieved_at:'2026-11-19T00:00:00Z' }, entries: Array.from({length: count}, (_, i) => ({ model: `m${i}`, category: 'overall', rating: 1000 })) });
describe('import safety', () => {
  it('matches presentation changes without merging version or effort', () => {
    const ids = aliasMap([['claude-opus-5.5-high', 'opus']]);
    expect(ids.get(identityKey('Claude Opus 5.5 (High)'))).toBe('opus');
    expect(ids.get(identityKey('Claude Opus 5.5 (Max)'))).toBeUndefined();
    expect(ids.get(identityKey('Claude Opus 5 (High)'))).toBeUndefined();
    expect(() => aliasMap([['a-b', 'one'], ['a b', 'two']])).toThrow('Ambiguous');
  });
  it('rejects empty, reduced, regressed and invalid evidence', () => {
    expect(() => guardSnapshot('lmarena', snapshot(0), snapshot(10))).toThrow('zero');
    expect(() => guardSnapshot('lmarena', snapshot(6), snapshot(10))).toThrow('coverage loss');
    expect(() => guardSnapshot('lmarena', {...snapshot(10), meta:{as_of:'2026-01-01',retrieved_at:'2026-11-19T00:00:00Z'}}, snapshot(10))).toThrow('backwards');
    expect(() => guardSnapshot('lmarena', {...snapshot(1), entries:[{model:'x',category:'overall',rating:NaN}]})).toThrow('invalid');
  });
  it('leaves all accepted files untouched if one source fails', () => {
    const dir = mkdtempSync(join(tmpdir(), 'normie-atomic-'));
    writeFileSync(join(dir,'modelsdev.json'), JSON.stringify({meta:{retrieved_at:'2026-11-19T00:00:00Z'},models:[{model:'old'}]}));
    const before = readFileSync(join(dir,'modelsdev.json'),'utf8');
    expect(() => publishSnapshots(dir,new Map<string, unknown>([['modelsdev',{meta:{retrieved_at:'2026-11-19T00:00:00Z'},models:[{model:'new'}]}],['lmarena',snapshot(0)]]))).toThrow();
    expect(readFileSync(join(dir,'modelsdev.json'),'utf8')).toBe(before);
  });
});
