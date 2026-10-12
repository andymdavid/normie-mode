import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { indexabilityRows, writeIndexabilityReview } from './indexability-review';

const outputs: string[] = [];
afterEach(() => outputs.splice(0).forEach((directory) => rmSync(directory, { recursive: true, force: true })));

describe('indexability review', () => {
  it('classifies every current public route without applying a site change', () => {
    const rows = indexabilityRows();

    expect(rows).toHaveLength(105);
    expect(rows.filter((row) => row.proposed_disposition === 'index')).toHaveLength(62);
    expect(rows.filter((row) => row.proposed_disposition === 'noindex-follow')).toHaveLength(43);
    expect(rows.find((row) => row.url.endsWith('/best-ai-for/data-analysis'))?.approval).toContain('D-035');
    expect(rows.find((row) => row.url.endsWith('/models/gpt-5-2'))?.proposed_disposition).toBe('noindex-follow');
    expect(rows.find((row) => row.url.endsWith('/models/gpt-6-sol'))?.approval).toContain('owner review pending');
  });

  it('writes a stable CSV register', () => {
    const directory = mkdtempSync(join(tmpdir(), 'normie-indexability-'));
    outputs.push(directory);
    const output = join(directory, 'review.csv');

    const first = writeIndexabilityReview(resolveDist(), output);
    const second = writeIndexabilityReview(resolveDist(), output);

    expect(second).toEqual(first);
  });
});

function resolveDist() {
  return join(process.cwd(), 'dist');
}
