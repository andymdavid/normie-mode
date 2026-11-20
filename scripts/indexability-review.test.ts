import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { parse } from 'csv-parse/sync';
import { indexabilityRows, writeIndexabilityReview } from './indexability-review';

const outputs: string[] = [];
afterEach(() => outputs.splice(0).forEach((directory) => rmSync(directory, { recursive: true, force: true })));

describe('indexability review', () => {
  it('classifies every current public route without applying a site change', () => {
    const rows = indexabilityRows();

    // Nine provider-verified exact-version pages added by the November catch-up.
    for (const id of ['claude-fable-5-2','gpt-6-2-astra','gpt-6-2-sol','gpt-6-1-terra','gemini-4-carbon','gemini-4-hydrogen','gemini-4-neon','kimi-k3-1-pro','deepseek-v4-1-flash-1017'])
      expect(rows.find(row => row.url.endsWith(`/models/${id}`))?.proposed_disposition).toBe('index');
    expect(rows.find((row) => row.url.endsWith('/best-ai-for/data-analysis'))?.approval).toContain('D-035');
    expect(rows.find((row) => row.url.endsWith('/models/gpt-5-2'))?.proposed_disposition).toBe('index');
    expect(rows.find((row) => row.url.endsWith('/models/gpt-5-2'))?.approval).toContain('D-039');
    expect(rows.find((row) => row.url.endsWith('/models/gpt-6-sol'))?.approval).toContain('D-037');
  });

  it('writes a stable CSV register', () => {
    const directory = mkdtempSync(join(tmpdir(), 'normie-indexability-'));
    outputs.push(directory);
    const output = join(directory, 'review.csv');

    const first = writeIndexabilityReview(resolveDist(), output);
    const firstCsv = readFileSync(output, 'utf8');
    expect(firstCsv).toContain('url,family,parent');
    expect(firstCsv).toContain('https://normiemode.com/best-ai-for/excel-spreadsheets');
    expect(parse(firstCsv, {columns:true})).toHaveLength(first.length);
    writeIndexabilityReview(resolveDist(), output);
    expect(readFileSync(output, 'utf8')).toBe(firstCsv);
  });
});

function resolveDist() {
  return join(process.cwd(), 'dist');
}
