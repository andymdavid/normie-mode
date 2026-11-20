import { afterEach, describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { aliasMap, identityKey, guardSnapshot, publishSnapshots } from './import-guards';
const temporaryDirectories: string[] = [];
afterEach(() => temporaryDirectories.splice(0).forEach(dir => rmSync(dir, {recursive:true,force:true})));
const directories: string[] = [];
afterEach(() => directories.splice(0).forEach(dir => rmSync(dir, {recursive:true,force:true})));
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
  it('rejects a mutable specification alias changing exact versions', () => {
    const meta = {retrieved_at:'2026-11-20T00:00:00Z'};
    const previous = {meta,models:[{model:'september',source_model:'provider/latest',released_on:'2026-09-10'}]};
    const next = {meta,models:[{model:'september',source_model:'provider/latest',released_on:'2026-10-17'}]};
    expect(() => guardSnapshot('modelsdev',next,previous)).toThrow('mutable alias changed version');
  });
  it('leaves all accepted files untouched if one source fails', () => {
    const dir = mkdtempSync(join(tmpdir(), 'normie-atomic-'));
    directories.push(dir);
    writeFileSync(join(dir,'modelsdev.json'), JSON.stringify({meta:{retrieved_at:'2026-11-19T00:00:00Z'},models:[{model:'old'}]}));
    temporaryDirectories.push(dir);
    const before = readFileSync(join(dir,'modelsdev.json'),'utf8');
    expect(() => publishSnapshots(dir,new Map<string, unknown>([['modelsdev',{meta:{retrieved_at:'2026-11-19T00:00:00Z'},models:[{model:'new'}]}],['lmarena',snapshot(0)]]))).toThrow();
    expect(readFileSync(join(dir,'modelsdev.json'),'utf8')).toBe(before);
  });
});
