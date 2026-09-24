import { describe, expect, it } from 'vitest';
import { graph } from './graph';
import { imported } from './imported';
import { jobLeaders } from './jobs';

describe('jobs and tests', () => {
  const { epoch, lmarena } = imported();
  const benchmarks = new Set(epoch?.benchmarks.map((b) => b.name));
  const categories = new Set(lmarena?.entries.map((e) => e.category));

  it.each([...graph().tests.values()].map((t) => [t.id, t] as const))('%s points at real imported data', (_, t) => {
    expect(t.source === 'epoch' ? benchmarks.has(t.key) : categories.has(t.key)).toBe(true);
  });

  it.each([...graph().jobs.values()].map((j) => [j.id, j] as const))('%s has at least one test with results', (_, job) => {
    expect(jobLeaders(job).leaders.length).toBeGreaterThan(0);
  });
});
