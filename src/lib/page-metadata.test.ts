import { describe, expect, it } from 'vitest';
import { graph } from './graph';
import { rankedTestRows, tasksUsingTest } from './models';
import { allTaskPages } from './tasks';
import { benchmarkMetadata, modelMetadata, taskMetadata } from './page-metadata';

const BRAND_SUFFIX = ' · Normie Mode';

describe('public page metadata', () => {
  it('puts benchmark names first and keeps indexed benchmark titles concise', () => {
    const tests = [...graph().tests.values()]
      .filter((test) => test.source !== 'normie' && tasksUsingTest(test.id).length && rankedTestRows(test).length)
      .map((test) => benchmarkMetadata(test, rankedTestRows(test).length));

    expect(tests).toHaveLength(25);
    expect(tests.find((item) => item.title.startsWith('LMArena business'))).toBeDefined();
    expect(Math.max(...tests.map((item) => (item.title + BRAND_SUFFIX).length))).toBeLessThanOrEqual(60);
    expect(new Set(tests.map((item) => item.title)).size).toBe(tests.length);
  });

  it('keeps indexed task metadata unique without putting a changing month in the title', () => {
    const tasks = allTaskPages().filter((task) => !task.parent).map((task) => taskMetadata(task.label));

    expect(tasks).toHaveLength(15);
    expect(tasks.every((item) => !/\b20\d{2}\b/.test(item.title))).toBe(true);
    expect(new Set(tasks.map((item) => item.description)).size).toBe(tasks.length);
    expect(taskMetadata('Best AI for CVs and jobs').description).toContain('for CVs');
    expect(taskMetadata('Best AI for coding').description).toContain('for coding');
  });

  it('uses a compact factual model template', () => {
    const metadata = modelMetadata('Gemini 3.5 Flash-Lite', 'Google');

    expect((metadata.title + BRAND_SUFFIX).length).toBeLessThanOrEqual(60);
    expect(metadata.description).toContain('independent tests');
  });
});
